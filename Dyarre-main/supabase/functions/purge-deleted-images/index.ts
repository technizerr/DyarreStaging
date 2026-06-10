// Scheduled (via pg_cron) function: permanently deletes soft-deleted property
// images older than 30 days, removing both DB rows and storage files (public +
// originals). Runs unauthenticated — secured by the cron secret in the URL.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Require shared secret (set as CRON_SECRET; pg_cron must include header).
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: rows, error } = await supabase
    .from("property_images")
    .select("id, image_url, original_path")
    .lt("deleted_at", cutoff);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const publicPaths: string[] = [];
  const originalPaths: string[] = [];
  for (const r of rows || []) {
    const m = (r.image_url as string).split("/property-images/")[1];
    if (m) publicPaths.push(decodeURIComponent(m));
    if (r.original_path) originalPaths.push(r.original_path as string);
  }

  if (publicPaths.length) await supabase.storage.from("property-images").remove(publicPaths);
  if (originalPaths.length) await supabase.storage.from("property-originals").remove(originalPaths);

  const ids = (rows || []).map((r) => r.id as string);
  if (ids.length) await supabase.from("property_images").delete().in("id", ids);

  // Audit log entries (one per image)
  if (rows && rows.length) {
    const entries = rows.map((r) => ({
      action: "purge",
      image_id: r.id as string,
      bucket: "property-images",
      path: (r.image_url as string).split("/property-images/")[1] ?? null,
      details: { original_path: r.original_path ?? null, scheduled: true },
    }));
    await supabase.from("media_audit_log").insert(entries);
  }

  return new Response(
    JSON.stringify({ purged: ids.length, files_removed: publicPaths.length + originalPaths.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

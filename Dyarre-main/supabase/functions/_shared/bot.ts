// Shared bot helpers
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function requireBotKey(req: Request): Response | null {
  const expected = Deno.env.get("BOT_API_KEY");
  if (!expected) return json({ error: "BOT_API_KEY not configured" }, 500);
  const provided = req.headers.get("x-api-key") || req.headers.get("X-Api-Key");
  if (provided !== expected) return json({ error: "Unauthorized" }, 401);
  return null;
}

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

export function assertSafeHttpUrl(rawUrl: string): URL {
  const u = new URL(rawUrl);
  if (u.protocol !== "https:") throw new Error("HTTPS only");
  const host = u.hostname.toLowerCase();
  const blocked = ["localhost", "127.", "10.", "192.168.", "169.254.", "0.", "::1"];
  if (blocked.some((b) => host === b.replace(/\.$/, "") || host.startsWith(b))) {
    throw new Error("Blocked host");
  }
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) throw new Error("Blocked host");
  return u;
}

// Download a remote URL and upload to property-images bucket. Returns public URL.
export async function ingestImageFromUrl(
  supabase: ReturnType<typeof adminClient>,
  propertyId: string,
  imageUrl: string,
  index: number,
): Promise<string> {
  const safe = assertSafeHttpUrl(imageUrl);
  const res = await fetch(safe.toString(), { redirect: "error" });
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const bytes = new Uint8Array(await res.arrayBuffer());
  const path = `uploads/${propertyId}/${Date.now()}-${index}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("property-images")
    .upload(path, bytes, { contentType, upsert: false });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("property-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function ingestImageFromBytes(
  supabase: ReturnType<typeof adminClient>,
  propertyId: string,
  bytes: Uint8Array,
  contentType: string,
  index: number,
): Promise<string> {
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const path = `uploads/${propertyId}/${Date.now()}-${index}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("property-images")
    .upload(path, bytes, { contentType, upsert: false });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("property-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function attachImagesToProperty(
  supabase: ReturnType<typeof adminClient>,
  propertyId: string,
  publicUrls: string[],
) {
  if (!publicUrls.length) return;
  const rows = publicUrls.map((url, i) => ({
    property_id: propertyId,
    image_url: url,
    sort_order: i,
  }));
  const { error } = await supabase.from("property_images").insert(rows);
  if (error) throw error;
}

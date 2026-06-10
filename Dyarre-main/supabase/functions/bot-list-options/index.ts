import { corsHeaders, json, requireBotKey, adminClient } from "../_shared/bot.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = requireBotKey(req);
  if (auth) return auth;

  const supabase = adminClient();
  const [types, statuses, furnishings, locations] = await Promise.all([
    supabase.from("property_types").select("name").order("name"),
    supabase.from("property_statuses").select("name").order("name"),
    supabase.from("furnishing_options").select("name").order("name"),
    supabase.from("locations").select("city, zone").order("city"),
  ]);

  return json({
    property_types: types.data?.map((r) => r.name) ?? [],
    property_statuses: statuses.data?.map((r) => r.name) ?? [],
    furnishing_options: furnishings.data?.map((r) => r.name) ?? [],
    locations: locations.data ?? [],
  });
});

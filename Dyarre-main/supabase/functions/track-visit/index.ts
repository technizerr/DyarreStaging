import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let { page_path, visitor_id, user_agent, referrer, session_duration } = body ?? {};

    // Strict validation: prevent DB bloat and analytics pollution
    if (typeof page_path !== "string" || page_path.length === 0 || page_path.length > 500 || !page_path.startsWith("/")) {
      return new Response(JSON.stringify({ error: "Invalid page_path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof visitor_id !== "string" || visitor_id.length === 0 || visitor_id.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid visitor_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    user_agent = typeof user_agent === "string" ? user_agent.slice(0, 512) : null;
    referrer = typeof referrer === "string" ? referrer.slice(0, 2048) : null;
    session_duration =
      Number.isInteger(session_duration) && session_duration >= 0 && session_duration < 86400
        ? session_duration
        : null;


    // Extract IP from headers
    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Get country from free IP geolocation
    let country: string | null = null;
    try {
      if (ip_address && ip_address !== "unknown" && ip_address !== "127.0.0.1") {
        const geoRes = await fetch(`https://ipapi.co/${ip_address}/country_name/`, {
          signal: AbortSignal.timeout(3000),
        });
        if (geoRes.ok) {
          const countryText = await geoRes.text();
          if (countryText && !countryText.includes("Undefined") && countryText.length < 100) {
            country = countryText.trim();
          }
        }
      }
    } catch {
      // Silent fail for geo lookup
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase.from("page_visits").insert({
      page_path,
      visitor_id,
      user_agent: user_agent || null,
      referrer: referrer || null,
      ip_address,
      country,
      session_duration: session_duration || null,
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("track-visit error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: roleData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { apiBaseUrl } = await req.json();
    if (!apiBaseUrl) {
      return new Response(JSON.stringify({ error: "apiBaseUrl is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // SSRF guard: only allow https public hosts
    try {
      const u = new URL(apiBaseUrl);
      if (u.protocol !== "https:") throw new Error("HTTPS only");
      const host = u.hostname.toLowerCase();
      const blocked = ["localhost", "127.", "10.", "192.168.", "169.254.", "0.", "::1"];
      if (blocked.some((b) => host === b.replace(/\.$/, "") || host.startsWith(b))) {
        throw new Error("Blocked host");
      }
      if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) throw new Error("Blocked host");
    } catch (e) {
      return new Response(JSON.stringify({ error: `Invalid apiBaseUrl: ${(e as Error).message}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Try to reach the API health endpoint
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const healthUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/health`;
      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        return new Response(JSON.stringify({
          success: true,
          status: res.status,
          message: "API server is reachable",
          data: body,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } else {
        const text = await res.text().catch(() => "");
        return new Response(JSON.stringify({
          success: false,
          status: res.status,
          message: `API responded with status ${res.status}`,
          data: text.slice(0, 500),
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      return new Response(JSON.stringify({
        success: false,
        message: fetchErr.name === "AbortError"
          ? "Connection timed out after 8 seconds"
          : `Could not reach API: ${fetchErr.message}`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

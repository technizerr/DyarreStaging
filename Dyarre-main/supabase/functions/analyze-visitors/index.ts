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
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { provider } = body; // provider: "lovable" | "custom"


    // Fetch last 30 days of visit data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: visits } = await adminClient
      .from("page_visits")
      .select("page_path, visitor_id, country, created_at, session_duration, referrer")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!visits || visits.length === 0) {
      return new Response(JSON.stringify({ analysis: "No visitor data available for analysis." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build summary for AI
    const summary = buildDataSummary(visits);

    const systemPrompt = `You are a real estate website analytics expert. Analyze the following visitor data summary and provide actionable insights about:
1. Traffic patterns and peak hours
2. Most popular pages and content
3. Geographic distribution of visitors
4. Session engagement metrics
5. Recommendations to improve conversions
Keep the analysis concise and actionable. Format with markdown.`;

    const userPrompt = `Here is the visitor data summary for the last 30 days:\n\n${summary}`;

    let analysis: string;

    if (provider === "custom") {
      // Read AI config server-side from site_settings (never trust client-supplied API key)
      const { data: cfg } = await adminClient
        .from("site_settings")
        .select("value")
        .eq("key", "ai_config")
        .maybeSingle();
      const aiCfg = (cfg?.value as any) || {};
      const api_key = aiCfg.api_key;
      const customEndpoint = aiCfg.endpoint || "https://api.openai.com/v1/chat/completions";
      const customModel = aiCfg.model || "gpt-4o-mini";

      if (!api_key) {
        return new Response(JSON.stringify({ error: "Custom AI not configured in site settings" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }


      // SSRF guard: only allow https public hosts
      try {
        const u = new URL(customEndpoint);
        if (u.protocol !== "https:") throw new Error("HTTPS only");
        const host = u.hostname.toLowerCase();
        const blocked = ["localhost", "127.", "10.", "192.168.", "169.254.", "0.", "::1"];
        if (blocked.some((b) => host === b.replace(/\.$/, "") || host.startsWith(b))) {
          throw new Error("Blocked host");
        }
        if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) throw new Error("Blocked host");
      } catch (e) {
        return new Response(JSON.stringify({ error: `Invalid endpoint: ${(e as Error).message}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiRes = await fetch(customEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: customModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        return new Response(JSON.stringify({ error: `Custom AI error: ${aiRes.status} ${errText}` }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiRes.json();
      analysis = aiData.choices?.[0]?.message?.content || "No analysis generated.";
    } else {
      // Use Lovable AI Gateway
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "AI not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!aiRes.ok) {
        if (aiRes.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiRes.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await aiRes.text();
        console.error("Lovable AI error:", aiRes.status, errText);
        return new Response(JSON.stringify({ error: "AI analysis failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiRes.json();
      analysis = aiData.choices?.[0]?.message?.content || "No analysis generated.";
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-visitors error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildDataSummary(visits: any[]): string {
  const totalVisits = visits.length;
  const uniqueVisitors = new Set(visits.map(v => v.visitor_id)).size;

  // Page popularity
  const pageCounts: Record<string, number> = {};
  visits.forEach(v => { pageCounts[v.page_path] = (pageCounts[v.page_path] || 0) + 1; });
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Country distribution
  const countryCounts: Record<string, number> = {};
  visits.forEach(v => {
    if (v.country) countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
  });
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Hourly distribution
  const hourly = new Array(24).fill(0);
  visits.forEach(v => { hourly[new Date(v.created_at).getHours()]++; });

  // Average session duration
  const durations = visits.filter(v => v.session_duration).map(v => v.session_duration);
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length) : 0;

  // Referrers
  const refCounts: Record<string, number> = {};
  visits.forEach(v => {
    const ref = v.referrer || "Direct";
    refCounts[ref] = (refCounts[ref] || 0) + 1;
  });
  const topRefs = Object.entries(refCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return `Total visits: ${totalVisits}
Unique visitors: ${uniqueVisitors}
Average session duration: ${avgDuration} seconds

Top Pages:
${topPages.map(([p, c]) => `  ${p}: ${c} views`).join("\n")}

Top Countries:
${topCountries.length > 0 ? topCountries.map(([c, n]) => `  ${c}: ${n} visits`).join("\n") : "  No country data yet"}

Hourly Distribution (0-23h):
  ${hourly.map((c, h) => `${h}h:${c}`).join(", ")}

Top Referrers:
${topRefs.map(([r, c]) => `  ${r}: ${c}`).join("\n")}`;
}

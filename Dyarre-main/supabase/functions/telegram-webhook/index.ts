// Telegram webhook: receives messages/photos, parses with Lovable AI,
// manages a draft per chat, and creates a published property on /publish.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

const TG_GATEWAY = "https://connector-gateway.lovable.dev/telegram";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function tgHeaders() {
  return {
    Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "X-Connection-Api-Key": Deno.env.get("TELEGRAM_API_KEY")!,
    "Content-Type": "application/json",
  };
}

async function tgSend(chatId: number | string, text: string) {
  await fetch(`${TG_GATEWAY}/sendMessage`, {
    method: "POST",
    headers: tgHeaders(),
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function tgGetFileBytes(fileId: string): Promise<{ bytes: Uint8Array; ext: string; contentType: string }> {
  const res = await fetch(`${TG_GATEWAY}/getFile`, {
    method: "POST",
    headers: tgHeaders(),
    body: JSON.stringify({ file_id: fileId }),
  });
  const data = await res.json();
  if (!res.ok || !data?.result?.file_path) throw new Error(`getFile failed: ${JSON.stringify(data)}`);
  const filePath: string = data.result.file_path;
  const dl = await fetch(`${TG_GATEWAY}/file/${filePath}`, { headers: tgHeaders() });
  if (!dl.ok) throw new Error(`file download failed ${dl.status}`);
  const bytes = new Uint8Array(await dl.arrayBuffer());
  const ext = filePath.split(".").pop()?.toLowerCase() || "jpg";
  const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return { bytes, ext, contentType };
}

// AI extraction: turn free text into partial property fields.
async function aiExtract(text: string, options: any): Promise<Record<string, unknown>> {
  const sys = `You are a parser for a Dubai real-estate listing assistant. Extract ANY of the following fields the user mentions and return JSON only (no prose):
title (string), description (string), type (string, one of: ${options.property_types.join(", ")}), price (number, AED), city (string), zone (string), bedrooms (int), bathrooms (int), size (int sqft), status (string, one of: ${options.property_statuses.join(", ")}), furnishing (string, one of: ${options.furnishing_options.join(", ")}), completion_status (string: Ready, Off-Plan), developer (string), features (string[]), whatsapp_number (string), google_map_url (string), expiry_date (YYYY-MM-DD).
Only include fields the user actually provided. Return strictly valid JSON object.`;

  const res = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    console.error("AI error", res.status, await res.text());
    return {};
  }
  const data = await res.json();
  try {
    return JSON.parse(data.choices?.[0]?.message?.content || "{}");
  } catch {
    return {};
  }
}

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

async function getSession(supabase: ReturnType<typeof adminClient>, chatId: string) {
  const { data } = await supabase.from("bot_sessions").select("*").eq("chat_id", chatId).maybeSingle();
  if (data) return data;
  const { data: created } = await supabase
    .from("bot_sessions")
    .insert({ chat_id: chatId, draft: {}, image_paths: [], status: "collecting" })
    .select("*")
    .single();
  return created;
}

async function saveSession(supabase: ReturnType<typeof adminClient>, chatId: string, patch: any) {
  await supabase.from("bot_sessions").update(patch).eq("chat_id", chatId);
}

async function resetSession(supabase: ReturnType<typeof adminClient>, chatId: string) {
  await supabase.from("bot_sessions").delete().eq("chat_id", chatId);
}

function summarizeDraft(d: any): string {
  const lines: string[] = ["<b>Current draft</b>"];
  for (const k of ["title","type","price","city","zone","bedrooms","bathrooms","size","status","furnishing","completion_status","developer","whatsapp_number","google_map_url","expiry_date"]) {
    if (d[k] !== undefined && d[k] !== null && d[k] !== "") lines.push(`• <b>${k}</b>: ${d[k]}`);
  }
  if (Array.isArray(d.features) && d.features.length) lines.push(`• <b>features</b>: ${d.features.join(", ")}`);
  if (d.description) lines.push(`• <b>description</b>: ${String(d.description).slice(0, 200)}`);
  return lines.join("\n");
}

const REQUIRED = ["title", "type", "city", "zone"];

async function deriveTelegramWebhookSecret(telegramApiKey: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-webhook:${telegramApiKey}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeEqual(a: string | null, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Verify Telegram secret token (derived from TELEGRAM_API_KEY; registered via setWebhook)
  const telegramApiKey = Deno.env.get("TELEGRAM_API_KEY");
  if (!telegramApiKey) return new Response("Server misconfigured", { status: 500 });
  const expectedSecret = await deriveTelegramWebhookSecret(telegramApiKey);
  if (!safeEqual(req.headers.get("x-telegram-bot-api-secret-token"), expectedSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let update: any;
  try { update = await req.json(); } catch { return new Response("ok"); }

  const message = update.message ?? update.edited_message;
  if (!message?.chat?.id) return new Response("ok");

  const chatId = String(message.chat.id);
  const supabase = adminClient();

  // Authorization: only allow specific Telegram chat IDs to use the bot
  const allowedIds = (Deno.env.get("ALLOWED_TELEGRAM_CHAT_IDS") || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (allowedIds.length === 0) {
    console.error("ALLOWED_TELEGRAM_CHAT_IDS not configured - rejecting all requests");
    try { await tgSend(chatId, "⚠️ Bot is not configured. Contact the administrator."); } catch {}
    return new Response("ok");
  }
  if (!allowedIds.includes(chatId)) {
    console.warn(`Unauthorized chat_id attempted access: ${chatId}`);
    try { await tgSend(chatId, "🚫 Unauthorized. This bot is restricted."); } catch {}
    return new Response("ok");
  }


  try {
    const session = await getSession(supabase, chatId);
    const draft = session.draft || {};
    const fileIds: string[] = session.image_paths || [];

    // Photo handling
    if (Array.isArray(message.photo) && message.photo.length) {
      const largest = message.photo[message.photo.length - 1];
      fileIds.push(largest.file_id);
      await saveSession(supabase, chatId, { image_paths: fileIds });
      await tgSend(chatId, `📸 Photo received (${fileIds.length} total). Send /publish when ready.`);
      return new Response("ok");
    }

    const text: string = (message.text || message.caption || "").trim();
    if (!text) return new Response("ok");

    // Commands
    const cmd = text.toLowerCase().split(/\s+/)[0];
    if (cmd === "/start" || cmd === "/help") {
      await tgSend(chatId,
        "👋 <b>Dyarre listing bot</b>\n\nSend property details in plain English (multiple messages OK), and attach photos. I'll parse them with AI.\n\n<b>Commands</b>\n/new — start fresh\n/show — preview current draft\n/publish — create the listing\n/cancel — discard draft");
      return new Response("ok");
    }
    if (cmd === "/new" || cmd === "/cancel") {
      await resetSession(supabase, chatId);
      await tgSend(chatId, cmd === "/new" ? "✨ Started a new draft. Send details and photos." : "🗑️ Draft cleared.");
      return new Response("ok");
    }
    if (cmd === "/show") {
      await tgSend(chatId, summarizeDraft(draft) + `\n\n📸 Photos queued: ${fileIds.length}`);
      return new Response("ok");
    }
    if (cmd === "/publish") {
      const missing = REQUIRED.filter((k) => !draft[k]);
      if (missing.length) {
        await tgSend(chatId, `❌ Missing required fields: <b>${missing.join(", ")}</b>\n\nSend them and try /publish again.`);
        return new Response("ok");
      }

      // Insert property
      const insertRow: any = {
        title: draft.title,
        description: draft.description ?? null,
        type: draft.type,
        price: Number(draft.price ?? 0),
        city: draft.city,
        zone: draft.zone,
        bedrooms: Number(draft.bedrooms ?? 0),
        bathrooms: Number(draft.bathrooms ?? 0),
        size: Number(draft.size ?? 0),
        status: draft.status ?? "For Sale",
        furnishing: draft.furnishing ?? "Unfurnished",
        completion_status: draft.completion_status ?? "Ready",
        developer: draft.developer ?? null,
        features: Array.isArray(draft.features) ? draft.features : [],
        whatsapp_number: draft.whatsapp_number ?? null,
        google_map_url: draft.google_map_url ?? null,
        expiry_date: draft.expiry_date ?? null,
        is_visible: true,
      };

      const { data: created, error } = await supabase
        .from("properties")
        .insert(insertRow)
        .select("id, display_id, reference_number, title")
        .single();

      if (error) {
        await tgSend(chatId, `❌ Failed to create: ${error.message}`);
        return new Response("ok");
      }

      // Upload all queued photos
      const imageUrls: string[] = [];
      for (let i = 0; i < fileIds.length; i++) {
        try {
          const { bytes, ext, contentType } = await tgGetFileBytes(fileIds[i]);
          const path = `uploads/${created.id}/${Date.now()}-${i}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("property-images")
            .upload(path, bytes, { contentType, upsert: false });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("property-images").getPublicUrl(path);
          imageUrls.push(pub.publicUrl);
        } catch (e) {
          console.error("photo upload failed", e);
        }
      }
      if (imageUrls.length) {
        await supabase.from("property_images").insert(
          imageUrls.map((url, i) => ({ property_id: created.id, image_url: url, sort_order: i }))
        );
      }

      await resetSession(supabase, chatId);
      await tgSend(chatId,
        `✅ <b>Published!</b>\n\n<b>${created.title}</b>\nRef: <code>${created.reference_number}</code>\nID: ${created.display_id}\n📸 ${imageUrls.length} photos uploaded`);
      return new Response("ok");
    }

    // Free text → AI extraction
    const optsRes = await Promise.all([
      supabase.from("property_types").select("name"),
      supabase.from("property_statuses").select("name"),
      supabase.from("furnishing_options").select("name"),
    ]);
    const options = {
      property_types: (optsRes[0].data ?? []).map((r) => r.name),
      property_statuses: (optsRes[1].data ?? []).map((r) => r.name),
      furnishing_options: (optsRes[2].data ?? []).map((r) => r.name),
    };

    const extracted = await aiExtract(text, options);
    const merged = { ...draft, ...extracted };
    await saveSession(supabase, chatId, { draft: merged, last_message: text });

    const newKeys = Object.keys(extracted);
    if (newKeys.length === 0) {
      await tgSend(chatId, "🤔 I couldn't extract any property details from that. Try: <i>'2BR apartment in Dubai Marina, 1.5M AED, 1100 sqft, furnished, ready'</i>");
    } else {
      await tgSend(chatId, `✅ Updated: <b>${newKeys.join(", ")}</b>\n\nSend more details, photos, /show to preview, or /publish.`);
    }
  } catch (e) {
    console.error("webhook error", e);
    try { await tgSend(chatId, `⚠️ Error: ${(e as Error).message}`); } catch (_) { /* ignore */ }
  }

  return new Response("ok");
});

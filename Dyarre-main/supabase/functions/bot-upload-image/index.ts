import { z } from "https://esm.sh/zod@3.23.8";
import {
  corsHeaders,
  json,
  requireBotKey,
  adminClient,
  ingestImageFromUrl,
  ingestImageFromBytes,
  attachImagesToProperty,
} from "../_shared/bot.ts";

const Schema = z.object({
  property_id: z.string().uuid(),
  image_url: z.string().url().optional(),
  image_base64: z.string().optional(),
  content_type: z.string().optional(),
}).refine((d) => d.image_url || d.image_base64, {
  message: "Provide either image_url or image_base64",
});

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/^data:[^;]+;base64,/, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = requireBotKey(req);
  if (auth) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const supabase = adminClient();
  const { property_id, image_url, image_base64, content_type } = parsed.data;

  // Determine next sort_order
  const { data: existing } = await supabase
    .from("property_images")
    .select("sort_order")
    .eq("property_id", property_id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  try {
    let publicUrl: string;
    if (image_url) {
      publicUrl = await ingestImageFromUrl(supabase, property_id, image_url, nextOrder);
    } else {
      const bytes = base64ToBytes(image_base64!);
      publicUrl = await ingestImageFromBytes(supabase, property_id, bytes, content_type || "image/jpeg", nextOrder);
    }
    await attachImagesToProperty(supabase, property_id, [publicUrl]);
    return json({ success: true, image_url: publicUrl });
  } catch (e) {
    console.error("Upload image error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

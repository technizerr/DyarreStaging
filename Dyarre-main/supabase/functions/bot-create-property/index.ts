import { z } from "https://esm.sh/zod@3.23.8";
import {
  corsHeaders,
  json,
  requireBotKey,
  adminClient,
  ingestImageFromUrl,
  attachImagesToProperty,
} from "../_shared/bot.ts";

const PropertySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional().nullable(),
  type: z.string().min(1),
  price: z.number().nonnegative().default(0),
  city: z.string().min(1),
  zone: z.string().min(1),
  bedrooms: z.number().int().nonnegative().default(0),
  bathrooms: z.number().int().nonnegative().default(0),
  size: z.number().int().nonnegative().default(0),
  status: z.string().default("For Sale"),
  furnishing: z.string().default("Unfurnished"),
  completion_status: z.string().default("Ready"),
  developer: z.string().optional().nullable(),
  features: z.array(z.string()).optional().default([]),
  whatsapp_number: z.string().optional().nullable(),
  google_map_url: z.string().url().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  is_visible: z.boolean().optional().default(true),
  image_urls: z.array(z.string().url()).optional().default([]),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = requireBotKey(req);
  if (auth) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const parsed = PropertySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { image_urls, ...propertyData } = parsed.data;
  const supabase = adminClient();

  const { data: created, error } = await supabase
    .from("properties")
    .insert(propertyData)
    .select("id, display_id, reference_number, title")
    .single();

  if (error) {
    console.error("Insert property error:", error);
    return json({ error: error.message }, 500);
  }

  const uploadedUrls: string[] = [];
  const failures: { url: string; error: string }[] = [];
  for (let i = 0; i < image_urls.length; i++) {
    try {
      const publicUrl = await ingestImageFromUrl(supabase, created.id, image_urls[i], i);
      uploadedUrls.push(publicUrl);
    } catch (e) {
      failures.push({ url: image_urls[i], error: (e as Error).message });
    }
  }

  if (uploadedUrls.length) {
    try {
      await attachImagesToProperty(supabase, created.id, uploadedUrls);
    } catch (e) {
      console.error("Attach images error:", e);
    }
  }

  return json({
    success: true,
    property: created,
    images_uploaded: uploadedUrls.length,
    image_urls: uploadedUrls,
    image_failures: failures,
  });
});

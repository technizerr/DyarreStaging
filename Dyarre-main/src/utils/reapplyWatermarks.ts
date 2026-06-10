import { supabase } from "@/integrations/supabase/client";
import { reapplyToUrl, type WatermarkPreset, type WatermarkContext } from "@/utils/watermark";

interface ImageRow {
  id: string;
  image_url: string;
  sort_order: number;
  original_path: string | null;
}

interface PropertyRow {
  id: string;
  title: string;
  price: number;
  reference_number: string | null;
}

/**
 * Re-apply current watermark presets to every image of a property that has
 * an `original_path` stored in the private bucket. Existing public file is
 * overwritten in-place so URLs remain stable.
 */
export async function reapplyWatermarksForProperty(
  propertyId: string,
  presets: WatermarkPreset[],
): Promise<{ updated: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;
  let skipped = 0;

  const { data: prop, error: pErr } = await supabase
    .from("properties")
    .select("id, title, price, reference_number")
    .eq("id", propertyId)
    .maybeSingle<PropertyRow>();
  if (pErr || !prop) throw new Error(pErr?.message || "Property not found");

  const { data: images, error: iErr } = await supabase
    .from("property_images")
    .select("id, image_url, sort_order, original_path")
    .eq("property_id", propertyId)
    .is("deleted_at", null)
    .order("sort_order");
  if (iErr) throw new Error(iErr.message);

  for (const img of (images as ImageRow[]) || []) {
    if (!img.original_path) { skipped++; continue; }

    // Signed URL for the private original
    const { data: signed, error: sErr } = await supabase
      .storage.from("property-originals")
      .createSignedUrl(img.original_path, 300);
    if (sErr || !signed) { errors.push(`Sign failed for ${img.id}`); continue; }

    const ctx: WatermarkContext = {
      referenceNumber: prop.reference_number || "",
      sequenceIndex: img.sort_order,
      title: prop.title,
      price: prop.price,
    };

    let newFile: File;
    try {
      newFile = await reapplyToUrl(signed.signedUrl, presets, ctx, `${img.id}.jpg`);
    } catch (e) {
      errors.push(`Render failed for ${img.id}: ${(e as Error).message}`);
      continue;
    }

    // Public URL points at property-images/<propertyId>/<file>
    const pubMatch = img.image_url.split("/property-images/")[1];
    if (!pubMatch) { errors.push(`Cannot parse path for ${img.id}`); continue; }
    const publicPath = decodeURIComponent(pubMatch);

    const { error: upErr } = await supabase.storage
      .from("property-images")
      .upload(publicPath, newFile, { upsert: true, contentType: "image/jpeg" });
    if (upErr) { errors.push(`Upload failed for ${img.id}: ${upErr.message}`); continue; }

    updated++;
  }

  return { updated, skipped, errors };
}

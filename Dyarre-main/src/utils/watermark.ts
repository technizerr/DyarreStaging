/**
 * Image processing pipeline with admin-managed multi-watermark engine.
 *
 * Pipeline: load → resize (≤1920x1080) → trim whitespace → apply each enabled
 * watermark preset in sequence → output JPEG 0.88.
 *
 * Also exports the original (resized/trimmed but un-watermarked) file so callers
 * can store it in a private "originals" bucket for later re-watermarking.
 */

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

export type WatermarkContentType = "text" | "reference" | "sequence" | "title" | "price" | "logo";
export type WatermarkAnchor = "tl" | "tc" | "tr" | "ml" | "c" | "mr" | "bl" | "bc" | "br";
export type WatermarkPositionMode = "anchor" | "percent";

export interface WatermarkPreset {
  id: string;
  sequence: number;
  name: string;
  content_type: WatermarkContentType;
  text_value: string | null;
  logo_url: string | null;
  position_mode: WatermarkPositionMode;
  anchor: WatermarkAnchor;
  offset_x: number;
  offset_y: number;
  percent_x: number;
  percent_y: number;
  size_pct: number;
  opacity: number;
  rotation: number;
  color: string;
  font_weight: "normal" | "bold";
  stroke_color: string | null;
  stroke_width: number;
  is_enabled: boolean;
}

export interface WatermarkContext {
  referenceNumber?: string;
  sequenceIndex?: number; // 0-based image index within property
  title?: string;
  price?: string | number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function resizeImage(img: HTMLImageElement): HTMLCanvasElement {
  let w = img.width;
  let h = img.height;
  if (w > MAX_WIDTH || h > MAX_HEIGHT) {
    const ratio = Math.min(MAX_WIDTH / w, MAX_HEIGHT / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return canvas;
}

function trimCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let top = height, bottom = 0, left = width, right = 0;
  const threshold = 250;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a > 10 && (r < threshold || g < threshold || b < threshold)) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (top >= bottom || left >= right) return canvas;
  const pad = 2;
  const tL = Math.max(0, left - pad);
  const tT = Math.max(0, top - pad);
  const tW = Math.min(width - tL, right - left + 1 + pad * 2);
  const tH = Math.min(height - tT, bottom - top + 1 + pad * 2);
  const trimmed = document.createElement("canvas");
  trimmed.width = tW;
  trimmed.height = tH;
  trimmed.getContext("2d")!.drawImage(canvas, tL, tT, tW, tH, 0, 0, tW, tH);
  return trimmed;
}

function resolveContent(preset: WatermarkPreset, ctx: WatermarkContext): string {
  switch (preset.content_type) {
    case "text": return preset.text_value || "";
    case "reference": return ctx.referenceNumber || "";
    case "sequence": return ctx.sequenceIndex !== undefined ? String(ctx.sequenceIndex + 1) : "";
    case "title": return ctx.title || "";
    case "price": return ctx.price !== undefined ? String(ctx.price) : "";
    case "logo": return preset.logo_url || "";
  }
}

function computePosition(
  canvas: HTMLCanvasElement,
  preset: WatermarkPreset,
  itemW: number,
  itemH: number,
): { x: number; y: number; align: CanvasTextAlign; baseline: CanvasTextBaseline } {
  const { width, height } = canvas;
  if (preset.position_mode === "percent") {
    return {
      x: (width * preset.percent_x) / 100,
      y: (height * preset.percent_y) / 100,
      align: "center",
      baseline: "middle",
    };
  }
  // Anchor mode: position is the anchor point on the canvas + offset
  const anchorMap: Record<WatermarkAnchor, { x: number; y: number; align: CanvasTextAlign; baseline: CanvasTextBaseline }> = {
    tl: { x: 10, y: 10, align: "left", baseline: "top" },
    tc: { x: width / 2, y: 10, align: "center", baseline: "top" },
    tr: { x: width - 10, y: 10, align: "right", baseline: "top" },
    ml: { x: 10, y: height / 2, align: "left", baseline: "middle" },
    c:  { x: width / 2, y: height / 2, align: "center", baseline: "middle" },
    mr: { x: width - 10, y: height / 2, align: "right", baseline: "middle" },
    bl: { x: 10, y: height - 10, align: "left", baseline: "bottom" },
    bc: { x: width / 2, y: height - 10, align: "center", baseline: "bottom" },
    br: { x: width - 10, y: height - 10, align: "right", baseline: "bottom" },
  };
  const a = anchorMap[preset.anchor];
  return { x: a.x + preset.offset_x, y: a.y + preset.offset_y, align: a.align, baseline: a.baseline };
}

async function applyPreset(canvas: HTMLCanvasElement, preset: WatermarkPreset, ctx: WatermarkContext): Promise<void> {
  const content = resolveContent(preset, ctx);
  if (!content) return;

  const c = canvas.getContext("2d")!;
  const minDim = Math.min(canvas.width, canvas.height);

  c.save();
  c.globalAlpha = Math.max(0, Math.min(1, preset.opacity));

  if (preset.content_type === "logo") {
    const img = await loadImage(content);
    const logoH = Math.max(8, (minDim * preset.size_pct) / 100);
    const logoW = (img.width / img.height) * logoH;
    const pos = computePosition(canvas, preset, logoW, logoH);
    // Translate to draw point, rotate, then offset image by alignment
    c.translate(pos.x, pos.y);
    if (preset.rotation) c.rotate((preset.rotation * Math.PI) / 180);
    let dx = 0, dy = 0;
    if (pos.align === "center") dx = -logoW / 2;
    if (pos.align === "right") dx = -logoW;
    if (pos.baseline === "middle") dy = -logoH / 2;
    if (pos.baseline === "bottom") dy = -logoH;
    c.drawImage(img, dx, dy, logoW, logoH);
  } else {
    const fontSize = Math.max(10, (minDim * preset.size_pct) / 100);
    c.font = `${preset.font_weight} ${fontSize}px sans-serif`;
    const pos = computePosition(canvas, preset, 0, 0);
    c.textAlign = pos.align;
    c.textBaseline = pos.baseline;
    c.translate(pos.x, pos.y);
    if (preset.rotation) c.rotate((preset.rotation * Math.PI) / 180);
    if (preset.stroke_width > 0 && preset.stroke_color) {
      c.lineWidth = preset.stroke_width;
      c.strokeStyle = preset.stroke_color;
      c.strokeText(content, 0, 0);
    }
    c.fillStyle = preset.color;
    c.fillText(content, 0, 0);
  }
  c.restore();
}

function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Failed to create blob"));
        resolve(new File([blob], name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.88,
    );
  });
}

/**
 * Full pipeline: returns both the processed (watermarked) file and the
 * resized-but-un-watermarked "original" so the caller can persist both.
 */
export async function processImage(
  file: File,
  presets: WatermarkPreset[],
  ctx: WatermarkContext,
): Promise<{ processed: File; original: File }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const baseCanvas = trimCanvas(resizeImage(img));

    // Clone for original (pre-watermark)
    const originalCanvas = document.createElement("canvas");
    originalCanvas.width = baseCanvas.width;
    originalCanvas.height = baseCanvas.height;
    originalCanvas.getContext("2d")!.drawImage(baseCanvas, 0, 0);

    const enabled = [...presets].filter((p) => p.is_enabled).sort((a, b) => a.sequence - b.sequence);
    for (const preset of enabled) {
      try { await applyPreset(baseCanvas, preset, ctx); }
      catch (e) { console.warn(`Watermark preset '${preset.name}' failed:`, e); }
    }

    const [processed, original] = await Promise.all([
      canvasToFile(baseCanvas, file.name),
      canvasToFile(originalCanvas, file.name),
    ]);
    return { processed, original };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Re-apply current presets to an already-processed image (loaded from URL,
 * typically a signed URL of the stored original). Used by the "re-apply
 * watermarks" admin action. Skips resize/trim because the original is already
 * normalised.
 */
export async function reapplyToUrl(
  imageUrl: string,
  presets: WatermarkPreset[],
  ctx: WatermarkContext,
  fileName = "image.jpg",
): Promise<File> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  const enabled = [...presets].filter((p) => p.is_enabled).sort((a, b) => a.sequence - b.sequence);
  for (const preset of enabled) {
    try { await applyPreset(canvas, preset, ctx); }
    catch (e) { console.warn(`Watermark preset '${preset.name}' failed:`, e); }
  }
  return canvasToFile(canvas, fileName);
}

/**
 * Legacy entrypoint kept for backwards compatibility with any old callers.
 * Loads presets-less default behaviour using just the reference number.
 */
export async function addWatermark(file: File, referenceNumber?: string): Promise<File> {
  const fallbackPresets: WatermarkPreset[] = [
    {
      id: "fallback-1", sequence: 1, name: "Brand Center", content_type: "text",
      text_value: "Dyarre.com", logo_url: null, position_mode: "anchor", anchor: "c",
      offset_x: 0, offset_y: 0, percent_x: 50, percent_y: 50, size_pct: 5, opacity: 0.45,
      rotation: 0, color: "#ffffff", font_weight: "bold", stroke_color: "#000000",
      stroke_width: 0, is_enabled: true,
    },
    {
      id: "fallback-2", sequence: 2, name: "Reference", content_type: "reference",
      text_value: null, logo_url: null, position_mode: "anchor", anchor: "bc",
      offset_x: 0, offset_y: 0, percent_x: 50, percent_y: 95, size_pct: 1.5, opacity: 0.85,
      rotation: 0, color: "#000000", font_weight: "bold", stroke_color: "#ffffff",
      stroke_width: 2, is_enabled: true,
    },
  ];
  const { processed } = await processImage(file, fallbackPresets, { referenceNumber });
  return processed;
}

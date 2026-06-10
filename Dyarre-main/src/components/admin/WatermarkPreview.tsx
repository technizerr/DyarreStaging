import { useEffect, useRef } from "react";
import type { WatermarkPreset } from "@/utils/watermark";

interface Props {
  presets: WatermarkPreset[];
  width?: number;
  height?: number;
  referenceNumber?: string;
  title?: string;
  price?: string | number;
}

/**
 * Lightweight client-side preview that renders a sample gradient + the given
 * watermark presets on a canvas. Mirrors the engine logic in
 * `src/utils/watermark.ts` but standalone (no resize/trim).
 */
export function WatermarkPreview({
  presets, width = 600, height = 360,
  referenceNumber = "DYR-0001", title = "Sample Property", price = "AED 2.5M",
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const c = canvas.getContext("2d")!;

    // Sample background
    const grad = c.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#7a6240");
    grad.addColorStop(1, "#3a2d1a");
    c.fillStyle = grad;
    c.fillRect(0, 0, width, height);
    c.fillStyle = "rgba(255,255,255,0.08)";
    for (let i = 0; i < 12; i++) {
      c.fillRect((i * 53) % width, (i * 71) % height, 80, 60);
    }
    c.fillStyle = "rgba(255,255,255,0.5)";
    c.font = "12px sans-serif";
    c.fillText("Preview", 8, 16);

    const minDim = Math.min(width, height);
    const ctx = { referenceNumber, sequenceIndex: 0, title, price };
    const enabled = [...presets].filter((p) => p.is_enabled).sort((a, b) => a.sequence - b.sequence);

    const renderText = (preset: WatermarkPreset, content: string) => {
      const fontSize = Math.max(10, (minDim * preset.size_pct) / 100);
      c.save();
      c.globalAlpha = Math.max(0, Math.min(1, preset.opacity));
      c.font = `${preset.font_weight} ${fontSize}px sans-serif`;
      const { x, y, align, baseline } = posOf(preset, width, height);
      c.textAlign = align; c.textBaseline = baseline;
      c.translate(x, y);
      if (preset.rotation) c.rotate((preset.rotation * Math.PI) / 180);
      if (preset.stroke_width > 0 && preset.stroke_color) {
        c.lineWidth = preset.stroke_width;
        c.strokeStyle = preset.stroke_color;
        c.strokeText(content, 0, 0);
      }
      c.fillStyle = preset.color;
      c.fillText(content, 0, 0);
      c.restore();
    };

    const renderLogo = (preset: WatermarkPreset, src: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const logoH = Math.max(8, (minDim * preset.size_pct) / 100);
        const logoW = (img.width / img.height) * logoH;
        c.save();
        c.globalAlpha = Math.max(0, Math.min(1, preset.opacity));
        const { x, y, align, baseline } = posOf(preset, width, height);
        c.translate(x, y);
        if (preset.rotation) c.rotate((preset.rotation * Math.PI) / 180);
        let dx = 0, dy = 0;
        if (align === "center") dx = -logoW / 2;
        if (align === "right") dx = -logoW;
        if (baseline === "middle") dy = -logoH / 2;
        if (baseline === "bottom") dy = -logoH;
        c.drawImage(img, dx, dy, logoW, logoH);
        c.restore();
      };
      img.src = src;
    };

    for (const preset of enabled) {
      const content = resolveContent(preset, ctx);
      if (!content) continue;
      if (preset.content_type === "logo") renderLogo(preset, content);
      else renderText(preset, content);
    }
  }, [presets, width, height, referenceNumber, title, price]);

  return <canvas ref={ref} className="w-full h-auto rounded-md border border-border bg-muted" />;
}

function resolveContent(p: WatermarkPreset, ctx: { referenceNumber?: string; sequenceIndex?: number; title?: string; price?: string | number }): string {
  switch (p.content_type) {
    case "text": return p.text_value || "";
    case "reference": return ctx.referenceNumber || "";
    case "sequence": return ctx.sequenceIndex !== undefined ? String(ctx.sequenceIndex + 1) : "";
    case "title": return ctx.title || "";
    case "price": return ctx.price !== undefined ? String(ctx.price) : "";
    case "logo": return p.logo_url || "";
  }
}

function posOf(p: WatermarkPreset, w: number, h: number) {
  if (p.position_mode === "percent") {
    return { x: (w * p.percent_x) / 100, y: (h * p.percent_y) / 100, align: "center" as CanvasTextAlign, baseline: "middle" as CanvasTextBaseline };
  }
  const map: Record<string, { x: number; y: number; align: CanvasTextAlign; baseline: CanvasTextBaseline }> = {
    tl: { x: 10, y: 10, align: "left", baseline: "top" },
    tc: { x: w / 2, y: 10, align: "center", baseline: "top" },
    tr: { x: w - 10, y: 10, align: "right", baseline: "top" },
    ml: { x: 10, y: h / 2, align: "left", baseline: "middle" },
    c:  { x: w / 2, y: h / 2, align: "center", baseline: "middle" },
    mr: { x: w - 10, y: h / 2, align: "right", baseline: "middle" },
    bl: { x: 10, y: h - 10, align: "left", baseline: "bottom" },
    bc: { x: w / 2, y: h - 10, align: "center", baseline: "bottom" },
    br: { x: w - 10, y: h - 10, align: "right", baseline: "bottom" },
  };
  const a = map[p.anchor];
  return { x: a.x + p.offset_x, y: a.y + p.offset_y, align: a.align, baseline: a.baseline };
}

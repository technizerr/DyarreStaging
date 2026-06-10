import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ChevronUp, ChevronDown, Edit2, Upload, Save, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWatermarkPresets } from "@/hooks/useWatermarkPresets";
import { WatermarkPreview } from "./WatermarkPreview";
import type { WatermarkPreset, WatermarkAnchor, WatermarkContentType } from "@/utils/watermark";

const ANCHORS: WatermarkAnchor[] = ["tl","tc","tr","ml","c","mr","bl","bc","br"];
const ANCHOR_LABEL: Record<WatermarkAnchor, string> = {
  tl: "↖", tc: "↑", tr: "↗", ml: "←", c: "•", mr: "→", bl: "↙", bc: "↓", br: "↘",
};
const CONTENT_TYPES: { value: WatermarkContentType; label: string; helper: string }[] = [
  { value: "text", label: "Static Text", helper: "Fixed text you type below." },
  { value: "reference", label: "Reference Number", helper: "Auto: DYR-XXXX from the property." },
  { value: "sequence", label: "Image Sequence #", helper: "Auto: 1, 2, 3 for each image in the property." },
  { value: "title", label: "Property Title", helper: "Auto: the property's title." },
  { value: "price", label: "Property Price", helper: "Auto: the property's price." },
  { value: "logo", label: "Logo / Image", helper: "Upload a PNG/JPG to stamp on the image." },
];

const emptyPreset = (sequence: number): Omit<WatermarkPreset, "id"> => ({
  sequence, name: "New watermark", content_type: "text",
  text_value: "Dyarre.com", logo_url: null,
  position_mode: "anchor", anchor: "c",
  offset_x: 0, offset_y: 0, percent_x: 50, percent_y: 50,
  size_pct: 5, opacity: 0.5, rotation: 0,
  color: "#ffffff", font_weight: "bold",
  stroke_color: "#000000", stroke_width: 0,
  is_enabled: true,
});

export function WatermarkPresetEditor() {
  const { presets, reload, loading } = useWatermarkPresets();
  const [editing, setEditing] = useState<WatermarkPreset | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    const next = Math.max(0, ...presets.map((p) => p.sequence)) + 1;
    setEditing({ id: "new", ...emptyPreset(next) });
    setCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this watermark preset?")) return;
    const { error } = await supabase.from("watermark_presets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Preset deleted"); reload(); }
  };

  const handleToggle = async (p: WatermarkPreset) => {
    const { error } = await supabase.from("watermark_presets").update({ is_enabled: !p.is_enabled }).eq("id", p.id);
    if (error) toast.error(error.message);
    else reload();
  };

  const move = async (p: WatermarkPreset, dir: -1 | 1) => {
    const sorted = [...presets].sort((a, b) => a.sequence - b.sequence);
    const idx = sorted.findIndex((x) => x.id === p.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("watermark_presets").update({ sequence: swap.sequence }).eq("id", p.id),
      supabase.from("watermark_presets").update({ sequence: p.sequence }).eq("id", swap.id),
    ]);
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Watermarks are applied in sequence order. Use the preview to fine-tune position and style.
        </p>
        <button onClick={handleCreate} className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> Add Watermark
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading presets…</p>
      ) : (
        <div className="space-y-2">
          {presets.length === 0 && (
            <p className="text-sm text-muted-foreground p-4 bg-secondary rounded-md">No watermark presets yet. Add one to start.</p>
          )}
          {presets.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-secondary rounded-md">
              <span className="text-xs font-mono w-6 text-center text-muted-foreground">#{p.sequence}</span>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => move(p, -1)} disabled={i === 0} className="disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                <button onClick={() => move(p, 1)} disabled={i === presets.length - 1} className="disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {CONTENT_TYPES.find((t) => t.value === p.content_type)?.label}
                  {p.content_type === "text" && p.text_value ? ` — "${p.text_value}"` : ""}
                  {" · "}
                  {p.position_mode === "anchor" ? `${p.anchor.toUpperCase()} (${p.offset_x},${p.offset_y}px)` : `${p.percent_x.toFixed(0)}%,${p.percent_y.toFixed(0)}%`}
                </p>
              </div>
              <Switch checked={p.is_enabled} onCheckedChange={() => handleToggle(p)} />
              <button onClick={() => { setEditing(p); setCreating(false); }} className="p-1.5 hover:bg-card rounded"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Live preview (with all enabled watermarks)</p>
        <WatermarkPreview presets={presets} />
      </div>

      {editing && (
        <PresetDialog
          preset={editing}
          isNew={creating}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); reload(); }}
        />
      )}
    </div>
  );
}

// =====================================================================

function PresetDialog({
  preset, isNew, onClose, onSaved,
}: { preset: WatermarkPreset; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<WatermarkPreset>(preset);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(preset), [preset]);

  const update = <K extends keyof WatermarkPreset>(key: K, value: WatermarkPreset[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSaving(true);
    const { id, ...rest } = draft;
    const op = isNew
      ? supabase.from("watermark_presets").insert([rest])
      : supabase.from("watermark_presets").update(rest).eq("id", id);
    const { error } = await op;
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Preset saved"); onSaved(); }
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const path = `watermarks/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("property-images").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploadingLogo(false); return; }
    const { data } = supabase.storage.from("property-images").getPublicUrl(path);
    update("logo_url", data.publicUrl);
    setUploadingLogo(false);
    toast.success("Logo uploaded");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-semibold">{isNew ? "Add Watermark" : "Edit Watermark"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Internal Name (admin only)">
            <input value={draft.name} onChange={(e) => update("name", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Sequence">
            <input type="number" value={draft.sequence} onChange={(e) => update("sequence", Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Content Type">
            <select value={draft.content_type} onChange={(e) => update("content_type", e.target.value as WatermarkContentType)} className={inputCls}>
              {CONTENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <p className="text-[10px] text-muted-foreground mt-1">{CONTENT_TYPES.find((t) => t.value === draft.content_type)?.helper}</p>
          </Field>
          {draft.content_type === "text" && (
            <Field label="Text Value">
              <input value={draft.text_value || ""} onChange={(e) => update("text_value", e.target.value)} className={inputCls} />
            </Field>
          )}
          {draft.content_type === "logo" && (
            <Field label="Logo Image">
              <div className="flex items-center gap-2">
                {draft.logo_url && <img src={draft.logo_url} alt="logo" className="w-10 h-10 object-contain bg-secondary rounded" />}
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingLogo} className="inline-flex items-center gap-2 px-3 py-2 text-xs border border-border rounded-md hover:bg-secondary">
                  <Upload className="w-3.5 h-3.5" /> {uploadingLogo ? "Uploading…" : "Upload logo"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
              </div>
            </Field>
          )}
        </div>

        {/* Position */}
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Position</p>
          <Tabs value={draft.position_mode} onValueChange={(v) => update("position_mode", v as "anchor" | "percent")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="anchor">Anchor + Offset (px)</TabsTrigger>
              <TabsTrigger value="percent">Percent X/Y (responsive)</TabsTrigger>
            </TabsList>

            <TabsContent value="anchor" className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Anchor point on the image</p>
                <div className="grid grid-cols-3 gap-1 w-32">
                  {ANCHORS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => update("anchor", a)}
                      className={`aspect-square text-lg border rounded ${draft.anchor === a ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border hover:border-accent"}`}
                    >{ANCHOR_LABEL[a]}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Offset X (px)"><input type="number" value={draft.offset_x} onChange={(e) => update("offset_x", Number(e.target.value))} className={inputCls} /></Field>
                <Field label="Offset Y (px)"><input type="number" value={draft.offset_y} onChange={(e) => update("offset_y", Number(e.target.value))} className={inputCls} /></Field>
              </div>
            </TabsContent>

            <TabsContent value="percent" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label={`X: ${draft.percent_x.toFixed(0)}%`}>
                  <input type="range" min={0} max={100} step={0.5} value={draft.percent_x} onChange={(e) => update("percent_x", Number(e.target.value))} className="w-full" />
                </Field>
                <Field label={`Y: ${draft.percent_y.toFixed(0)}%`}>
                  <input type="range" min={0} max={100} step={0.5} value={draft.percent_y} onChange={(e) => update("percent_y", Number(e.target.value))} className="w-full" />
                </Field>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Style */}
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Style</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label={`Size: ${draft.size_pct}%`}>
              <input type="range" min={0.5} max={30} step={0.1} value={draft.size_pct} onChange={(e) => update("size_pct", Number(e.target.value))} className="w-full" />
            </Field>
            <Field label={`Opacity: ${Math.round(draft.opacity * 100)}%`}>
              <input type="range" min={0} max={1} step={0.01} value={draft.opacity} onChange={(e) => update("opacity", Number(e.target.value))} className="w-full" />
            </Field>
            <Field label={`Rotation: ${draft.rotation}°`}>
              <input type="range" min={-180} max={180} step={1} value={draft.rotation} onChange={(e) => update("rotation", Number(e.target.value))} className="w-full" />
            </Field>
          </div>
          {draft.content_type !== "logo" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Color">
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.color} onChange={(e) => update("color", e.target.value)} className="w-10 h-10 rounded border border-border" />
                  <input value={draft.color} onChange={(e) => update("color", e.target.value)} className={inputCls} />
                </div>
              </Field>
              <Field label="Font Weight">
                <select value={draft.font_weight} onChange={(e) => update("font_weight", e.target.value as "normal" | "bold")} className={inputCls}>
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
              </Field>
              <Field label="Outline Color">
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.stroke_color || "#000000"} onChange={(e) => update("stroke_color", e.target.value)} className="w-10 h-10 rounded border border-border" />
                  <input value={draft.stroke_color || ""} onChange={(e) => update("stroke_color", e.target.value)} className={inputCls} />
                </div>
              </Field>
              <Field label={`Outline Width: ${draft.stroke_width}px`}>
                <input type="range" min={0} max={10} step={1} value={draft.stroke_width} onChange={(e) => update("stroke_width", Number(e.target.value))} className="w-full" />
              </Field>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Preview</p>
          <WatermarkPreview presets={[draft]} />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm border border-border rounded-md">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Undo2, RefreshCw } from "lucide-react";
import { logMediaAction } from "@/utils/mediaAudit";

interface TrashImage {
  id: string;
  image_url: string;
  property_id: string;
  deleted_at: string;
  original_path: string | null;
}

interface Props {
  /** If provided, restrict trash view to one property. */
  propertyId?: string;
  /** Called when trash items change (restore/purge). */
  onChange?: () => void;
}

export function MediaTrashPanel({ propertyId, onChange }: Props) {
  const [items, setItems] = useState<TrashImage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("property_images")
      .select("id, image_url, property_id, deleted_at, original_path")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (propertyId) q = q.eq("property_id", propertyId);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems((data as TrashImage[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [propertyId]);

  const restore = async (img: TrashImage) => {
    const { error } = await supabase.from("property_images").update({ deleted_at: null }).eq("id", img.id);
    if (error) toast.error(error.message);
    else {
      await logMediaAction({
        action: "restore",
        property_id: img.property_id,
        image_id: img.id,
        bucket: "property-images",
        path: img.image_url.split("/property-images/")[1],
      });
      toast.success("Image restored"); load(); onChange?.();
    }
  };

  const hardDelete = async (img: TrashImage) => {
    if (!confirm("Permanently delete this image? This cannot be undone.")) return;
    const pub = img.image_url.split("/property-images/")[1];
    if (pub) await supabase.storage.from("property-images").remove([decodeURIComponent(pub)]);
    if (img.original_path) await supabase.storage.from("property-originals").remove([img.original_path]);
    const { error } = await supabase.from("property_images").delete().eq("id", img.id);
    if (error) toast.error(error.message);
    else {
      await logMediaAction({
        action: "hard_delete",
        property_id: img.property_id,
        image_id: img.id,
        bucket: "property-images",
        path: pub,
        details: { original_path: img.original_path },
      });
      toast.success("Permanently deleted"); load(); onChange?.();
    }
  };

  const daysLeft = (deletedAt: string) => {
    const expires = new Date(deletedAt).getTime() + 30 * 86400000;
    return Math.max(0, Math.ceil((expires - Date.now()) / 86400000));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Soft-deleted images. Files auto-purge 30 days after deletion.
        </p>
        <button onClick={load} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4 bg-secondary rounded-md">Trash is empty.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map((img) => (
            <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden border border-border">
              <img src={img.image_url} alt="" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                <button onClick={() => restore(img)} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-card text-foreground rounded">
                  <Undo2 className="w-3 h-3" /> Restore
                </button>
                <button onClick={() => hardDelete(img)} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded">
                  <Trash2 className="w-3 h-3" /> Delete now
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-foreground/70 text-primary-foreground text-[10px] text-center py-0.5">
                {daysLeft(img.deleted_at)}d left
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

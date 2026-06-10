import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Upload, X, Image as ImageIcon, Download, RefreshCw, Archive, Undo2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { processImage } from "@/utils/watermark";
import { useWatermarkPresets } from "@/hooks/useWatermarkPresets";
import { downloadSingleImage, downloadImagesAsZip } from "@/utils/downloadImages";
import { reapplyWatermarksForProperty } from "@/utils/reapplyWatermarks";
import { logMediaAction } from "@/utils/mediaAudit";
import { MediaTrashPanel } from "@/components/admin/MediaTrashPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PropertyRow {
  id: string;
  display_id: number;
  title: string;
  description: string | null;
  type: string;
  price: number;
  city: string;
  zone: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  status: string;
  furnishing: string;
  completion_status: string;
  whatsapp_number: string | null;
  google_map_url: string | null;
  is_visible: boolean;
  features: string[] | null;
  created_at: string;
  reference_number: string | null;
  expiry_date: string | null;
  developer: string | null;
}

interface PropertyImage {
  id: string;
  image_url: string;
  sort_order: number;
  original_path: string | null;
}

const defaultForm = {
  title: "", description: "", type: "Apartment", price: 0, city: "Abu Dhabi", zone: "",
  bedrooms: 1, bathrooms: 1, size: 0, status: "For Sale", furnishing: "Unfurnished",
  completion_status: "Ready", whatsapp_number: "+971544444518", google_map_url: "",
  is_visible: true, features: [] as string[], expiry_date: "", developer: "",
};

export default function PropertyManagement() {
  const { isAdmin } = useAuth();
  const [propertyList, setPropertyList] = useState<PropertyRow[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(true);

  // Image management
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reapplying, setReapplying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [galleryTab, setGalleryTab] = useState<"active" | "trash">("active");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { presets: watermarkPresets } = useWatermarkPresets();

  // Filter options from DB
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [furnishings, setFurnishings] = useState<string[]>([]);
  const [locations, setLocations] = useState<{ city: string; zone: string }[]>([]);
  const [sortAsc, setSortAsc] = useState(true);
  const [imageCountMap, setImageCountMap] = useState<Record<string, number>>({});

  // Admin filters
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterDeveloper, setFilterDeveloper] = useState("");
  const [filterVisibility, setFilterVisibility] = useState("");

  useEffect(() => {
    fetchProperties();
  }, [sortAsc]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    const [t, s, f, l] = await Promise.all([
      supabase.from("property_types").select("name"),
      supabase.from("property_statuses").select("name"),
      supabase.from("furnishing_options").select("name"),
      supabase.from("locations").select("city, zone"),
    ]);
    if (t.data) setTypes(t.data.map(r => r.name));
    if (s.data) setStatuses(s.data.map(r => r.name));
    if (f.data) setFurnishings(f.data.map(r => r.name));
    if (l.data) setLocations(l.data);
  };




  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("properties").select("*").order("display_id", { ascending: sortAsc });
    if (error) { toast.error(error.message); } 
    else { setPropertyList(data || []); }
    // Fetch image counts
    const { data: imgData } = await supabase.from("property_images").select("property_id");
    if (imgData) {
      const counts: Record<string, number> = {};
      imgData.forEach(r => { counts[r.property_id] = (counts[r.property_id] || 0) + 1; });
      setImageCountMap(counts);
    }
    setLoading(false);
  };

  const fetchImages = async (propertyId: string) => {
    const { data } = await supabase
      .from("property_images")
      .select("*")
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .order("sort_order");
    setPropertyImages((data as PropertyImage[]) || []);
  };

  const developers = [...new Set(propertyList.map(p => p.developer).filter(Boolean) as string[])];

  const filtered = propertyList.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.zone.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || p.type === filterType;
    const matchesStatus = !filterStatus || p.status === filterStatus;
    const matchesCity = !filterCity || p.city === filterCity;
    const matchesDeveloper = !filterDeveloper || p.developer === filterDeveloper;
    const matchesVisibility = !filterVisibility || (filterVisibility === "visible" ? p.is_visible : !p.is_visible);
    return matchesSearch && matchesType && matchesStatus && matchesCity && matchesDeveloper && matchesVisibility;
  });

  const cities = [...new Set(locations.map(l => l.city))];
  const zonesForCity = locations.filter(l => l.city === formData.city).map(l => l.zone);

  const toggleVisibility = async (id: string) => {
    const prop = propertyList.find(p => p.id === id);
    if (!prop) return;
    const { error } = await supabase.from("properties").update({ is_visible: !prop.is_visible }).eq("id", id);
    if (error) toast.error(error.message);
    else setPropertyList(prev => prev.map(p => p.id === id ? { ...p, is_visible: !p.is_visible } : p));
  };

  const deleteProperty = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { setPropertyList(prev => prev.filter(p => p.id !== id)); toast.success("Property deleted"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      description: formData.description || null,
      type: formData.type,
      price: formData.price,
      city: formData.city,
      zone: formData.zone,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      size: formData.size,
      status: formData.status,
      furnishing: formData.furnishing,
      completion_status: formData.completion_status,
      whatsapp_number: formData.whatsapp_number || null,
      google_map_url: formData.google_map_url || null,
      is_visible: formData.is_visible,
      features: formData.features,
      expiry_date: formData.expiry_date || null,
      developer: formData.developer || null,
    };

    if (editingId) {
      const { error } = await supabase.from("properties").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Property updated");
    } else {
      const { error } = await supabase.from("properties").insert([payload]);
      if (error) { toast.error(error.message); return; }
      toast.success("Property created");
    }
    setShowForm(false);
    setEditingId(null);
    fetchProperties();
  };

  const startEdit = async (p: PropertyRow) => {
    setFormData({
      title: p.title,
      description: p.description || "",
      type: p.type,
      price: p.price,
      city: p.city,
      zone: p.zone,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      size: p.size,
      status: p.status,
      furnishing: p.furnishing,
      completion_status: p.completion_status,
      whatsapp_number: p.whatsapp_number || "",
      google_map_url: p.google_map_url || "",
      is_visible: p.is_visible,
      features: p.features || [],
      expiry_date: p.expiry_date || "",
      developer: p.developer || "",
    });
    setEditingId(p.id);
    setShowForm(true);
    await fetchImages(p.id);
  };

  // --- Image Upload (multi-watermark + originals) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingId || !e.target.files?.length) return;
    setUploading(true);
    const files = Array.from(e.target.files);
    const currentProp = propertyList.find((p) => p.id === editingId);
    const baseOrder = propertyImages.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sequenceIndex = baseOrder + i;
      let processed: File;
      let original: File;
      try {
        const res = await processImage(file, watermarkPresets, {
          referenceNumber: currentProp?.reference_number || "",
          sequenceIndex,
          title: currentProp?.title,
          price: currentProp?.price,
        });
        processed = res.processed;
        original = res.original;
      } catch {
        processed = file; original = file;
      }

      const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const publicPath = `uploads/${editingId}/${stamp}.jpg`;
      const originalPath = `uploads/${editingId}/${stamp}.jpg`;

      const { error: pubErr } = await supabase.storage.from("property-images").upload(publicPath, processed, { contentType: "image/jpeg" });
      if (pubErr) { toast.error(`Upload failed: ${pubErr.message}`); continue; }

      // Original is best-effort; ignore errors so upload doesn't fail entirely
      const { error: origErr } = await supabase.storage.from("property-originals").upload(originalPath, original, { contentType: "image/jpeg" });
      if (origErr) console.warn("Original upload skipped:", origErr.message);

      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(publicPath);
      const { data: inserted, error: dbErr } = await supabase.from("property_images").insert([{
        property_id: editingId,
        image_url: urlData.publicUrl,
        sort_order: sequenceIndex,
        original_path: origErr ? null : originalPath,
      }]).select("id").maybeSingle();
      if (dbErr) { toast.error(dbErr.message); continue; }

      await logMediaAction({
        action: "upload",
        property_id: editingId,
        image_id: inserted?.id,
        bucket: "property-images",
        path: publicPath,
        details: {
          original_bytes: file.size,
          processed_bytes: processed.size,
          original_stored: !origErr,
          sort_order: sequenceIndex,
        },
      });
    }

    await fetchImages(editingId);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Images uploaded");
  };

  // Soft delete (moves image to trash for 30 days)
  const softDeleteImage = async (img: PropertyImage) => {
    const { error } = await supabase
      .from("property_images")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", img.id);
    if (error) { toast.error(error.message); return; }
    setPropertyImages((prev) => prev.filter((i) => i.id !== img.id));
    await logMediaAction({
      action: "soft_delete",
      property_id: editingId,
      image_id: img.id,
      bucket: "property-images",
      path: img.image_url.split("/property-images/")[1],
    });
    toast.success("Moved to trash (30 days)");
  };

  const downloadOne = async (img: PropertyImage) => {
    try { await downloadSingleImage(img.image_url); }
    catch (e) { toast.error((e as Error).message); }
  };

  const downloadAll = async () => {
    if (!editingId) return;
    setDownloading(true);
    try {
      const ref = propertyList.find((p) => p.id === editingId)?.reference_number || editingId;
      await downloadImagesAsZip(
        propertyImages.map((i) => ({ url: i.image_url })),
        `${ref}.zip`,
      );
      toast.success("ZIP downloaded");
    } catch (e) { toast.error((e as Error).message); }
    finally { setDownloading(false); }
  };

  const reapplyWatermarks = async () => {
    if (!editingId) return;
    if (!confirm("Re-apply current watermark presets to all images of this property? This overwrites the stored files (URLs stay the same).")) return;
    setReapplying(true);
    try {
      const result = await reapplyWatermarksForProperty(editingId, watermarkPresets);
      toast.success(`Updated ${result.updated} image(s). Skipped ${result.skipped} (no original stored).`);
      if (result.errors.length) console.warn("Re-apply issues:", result.errors);
      await logMediaAction({
        action: "reapply",
        property_id: editingId,
        bucket: "property-images",
        details: { updated: result.updated, skipped: result.skipped, errors: result.errors.length },
      });
      await fetchImages(editingId);
    } catch (e) { toast.error((e as Error).message); }
    finally { setReapplying(false); }
  };

  const formatPrice = (price: number) => price >= 1000000 ? `AED ${(price / 1000000).toFixed(1)}M` : `AED ${price.toLocaleString()}`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Property Management</h1>
            <p className="text-sm text-muted-foreground mt-1">{propertyList.length} properties total</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData(defaultForm); setPropertyImages([]); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none">
            <option value="">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none">
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="px-3 py-2 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none">
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterDeveloper} onChange={e => setFilterDeveloper(e.target.value)} className="px-3 py-2 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none">
            <option value="">All Developers</option>
            {developers.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterVisibility} onChange={e => setFilterVisibility(e.target.value)} className="px-3 py-2 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none">
            <option value="">All Visibility</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        {/* Property Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setShowForm(false)} />
            <form onSubmit={handleSubmit} className="relative bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4">
              <h3 className="text-lg font-display font-semibold text-foreground">{editingId ? "Edit Property" : "Add New Property"}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Title" value={formData.title} onChange={(v) => setFormData(f => ({ ...f, title: v }))} />
                <FormSelect label="Type" value={formData.type} onChange={(v) => setFormData(f => ({ ...f, type: v }))} options={types.length ? types : ["Apartment","Villa","Townhouse","Land","Penthouse","Building"]} />
                <FormSelect label="City" value={formData.city} onChange={(v) => setFormData(f => ({ ...f, city: v, zone: "" }))} options={cities.length ? cities : ["Abu Dhabi","Dubai","Sharjah"]} />
                <FormSelect label="Zone" value={formData.zone} onChange={(v) => setFormData(f => ({ ...f, zone: v }))} options={zonesForCity.length ? zonesForCity : [""]} />
                <FormSelect label="Status" value={formData.status} onChange={(v) => setFormData(f => ({ ...f, status: v }))} options={statuses.length ? statuses : ["For Sale","For Rent","Off-plan"]} />
                <FormField label="Price (AED)" value={String(formData.price || "")} onChange={(v) => setFormData(f => ({ ...f, price: Number(v) }))} type="number" />
                <FormField label="Size (sqft)" value={String(formData.size || "")} onChange={(v) => setFormData(f => ({ ...f, size: Number(v) }))} type="number" />
                <FormField label="Bedrooms" value={String(formData.bedrooms || "")} onChange={(v) => setFormData(f => ({ ...f, bedrooms: Number(v) }))} type="number" />
                <FormField label="Bathrooms" value={String(formData.bathrooms || "")} onChange={(v) => setFormData(f => ({ ...f, bathrooms: Number(v) }))} type="number" />
                <FormField label="WhatsApp" value={formData.whatsapp_number} onChange={(v) => setFormData(f => ({ ...f, whatsapp_number: v }))} />
                <FormField label="Google Map URL" value={formData.google_map_url} onChange={(v) => setFormData(f => ({ ...f, google_map_url: v }))} />
                <FormSelect label="Furnishing" value={formData.furnishing} onChange={(v) => setFormData(f => ({ ...f, furnishing: v }))} options={furnishings.length ? furnishings : ["Furnished","Semi-Furnished","Unfurnished"]} />
                <FormSelect label="Completion" value={formData.completion_status} onChange={(v) => setFormData(f => ({ ...f, completion_status: v }))} options={["Ready","Under Construction","Off-plan"]} />
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Expiry Date</label>
                  <input type="date" value={formData.expiry_date} onChange={(e) => setFormData(f => ({ ...f, expiry_date: e.target.value }))} className="w-full px-4 py-2.5 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none" />
                </div>
                <FormField label="Developer" value={formData.developer} onChange={(v) => setFormData(f => ({ ...f, developer: v }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none resize-none"
                />
              </div>

              {/* Image Management Section */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Property Images</label>
                
                {!editingId && (
                  <p className="text-xs text-muted-foreground bg-secondary rounded-md p-3">
                    💡 Save the property first, then edit it to upload images.
                  </p>
                )}

                {editingId && (
                  <Tabs value={galleryTab} onValueChange={(v) => setGalleryTab(v as "active" | "trash")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="active">Active ({propertyImages.length})</TabsTrigger>
                      <TabsTrigger value="trash"><Archive className="w-3 h-3 mr-1" />Trash</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="space-y-3 mt-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={downloadAll}
                          disabled={downloading || propertyImages.length === 0}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-secondary hover:bg-secondary/80 disabled:opacity-50"
                        >
                          <Download className="w-3 h-3" />
                          {downloading ? "Zipping..." : "Download all (ZIP)"}
                        </button>
                        <button
                          type="button"
                          onClick={reapplyWatermarks}
                          disabled={reapplying || propertyImages.length === 0}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-secondary hover:bg-secondary/80 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${reapplying ? "animate-spin" : ""}`} />
                          {reapplying ? "Re-applying..." : "Re-apply watermarks"}
                        </button>
                      </div>

                      {propertyImages.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {propertyImages.map((img) => (
                            <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden border border-border">
                              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={() => downloadOne(img)} className="p-1 bg-foreground/80 text-background rounded-full" title="Download">
                                  <Download className="w-3 h-3" />
                                </button>
                                <button type="button" onClick={() => softDeleteImage(img)} className="p-1 bg-destructive text-destructive-foreground rounded-full" title="Move to trash">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-foreground/60 text-primary-foreground text-[10px] text-center py-0.5">
                                #{img.sort_order + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent/50 hover:bg-secondary/50 transition-colors"
                      >
                        {uploading ? (
                          <span className="text-sm text-muted-foreground">Uploading & watermarking...</span>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Click to upload images</span>
                          </>
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    </TabsContent>

                    <TabsContent value="trash" className="mt-3">
                      <MediaTrashPanel propertyId={editingId} onChange={() => fetchImages(editingId)} />
                    </TabsContent>
                  </Tabs>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-border rounded-md">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md">
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading properties...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 font-medium text-muted-foreground w-16 cursor-pointer select-none" onClick={() => setSortAsc(prev => !prev)}>
                    # {sortAsc ? "↑" : "↓"}
                  </th>
                  <th className="p-4 font-medium text-muted-foreground">Property</th>
                  <th className="p-4 font-medium text-muted-foreground w-16">
                    <ImageIcon className="w-4 h-4" />
                  </th>
                  <th className="p-4 font-medium text-muted-foreground">Type</th>
                  <th className="p-4 font-medium text-muted-foreground">Developer</th>
                  <th className="p-4 font-medium text-muted-foreground">Price</th>
                  <th className="p-4 font-medium text-muted-foreground">Status</th>
                  <th className="p-4 font-medium text-muted-foreground">Ref#</th>
                  <th className="p-4 font-medium text-muted-foreground">Expiry</th>
                  <th className="p-4 font-medium text-muted-foreground">Visible</th>
                  <th className="p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="p-4 text-muted-foreground font-mono text-xs">{p.display_id}</td>
                    <td className="p-4">
                      <div className="font-medium text-foreground">{p.title}</div>
                      <div className="text-xs text-muted-foreground">{p.zone}, {p.city}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <ImageIcon className="w-3 h-3" />
                        {imageCountMap[p.id] || 0}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{p.type}</td>
                    <td className="p-4 text-muted-foreground text-xs">{p.developer || "—"}</td>
                    <td className="p-4 text-foreground font-medium">{formatPrice(p.price)}</td>
                    <td className="p-4"><span className="px-2 py-0.5 text-xs rounded bg-secondary">{p.status}</span></td>
                    <td className="p-4 text-xs font-mono text-muted-foreground">{p.reference_number || "—"}</td>
                    <td className="p-4">
                      {p.expiry_date ? (() => {
                        const exp = new Date(p.expiry_date);
                        const now = new Date();
                        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
                        const color = daysLeft < 0 ? "text-destructive" : daysLeft <= 7 ? "text-orange-500" : "text-muted-foreground";
                        return <span className={`text-xs ${color}`}>{p.expiry_date}{daysLeft < 0 ? " (expired)" : daysLeft <= 7 ? ` (${daysLeft}d)` : ""}</span>;
                      })() : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="p-4">
                      <button onClick={() => toggleVisibility(p.id)} className="text-muted-foreground hover:text-foreground">
                        {p.is_visible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(p)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                        {isAdmin && (
                          <button onClick={() => deleteProperty(p.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">No properties found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function FormField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none" />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none">
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

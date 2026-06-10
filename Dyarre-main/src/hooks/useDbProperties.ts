import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Property, UAECity, PropertyType, PropertyStatus, FurnishingStatus, CompletionStatus } from "@/data/mockData";
import placeholderImg from "@/assets/property-apartment.jpg";

interface DbPropertyRow {
  id: string;
  display_id: number;
  reference_number: string | null;
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
  developer: string | null;
  created_at: string;
  expiry_date: string | null;
}

export interface DbProperty extends Property {
  displayId: number;
  referenceNumber: string | null;
  developer?: string | null;
  expiryDate?: string | null;
}

function mapRow(row: DbPropertyRow, images: string[]): DbProperty {
  return {
    id: row.id,
    displayId: row.display_id,
    referenceNumber: row.reference_number,
    title: row.title,
    description: row.description ?? "",
    type: row.type as PropertyType,
    price: Number(row.price) || 0,
    city: row.city as UAECity,
    zone: row.zone,
    location: row.city,
    area: row.zone,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    size: row.size,
    status: row.status as PropertyStatus,
    furnishing: row.furnishing as FurnishingStatus,
    completionStatus: row.completion_status as CompletionStatus,
    whatsappNumber: row.whatsapp_number || "971544444518",
    googleMapUrl: row.google_map_url || "",
    isVisible: row.is_visible,
    images: images.length ? images : [placeholderImg],
    features: row.features ?? [],
    developer: row.developer,
    expiryDate: row.expiry_date,
    createdAt: row.created_at,
  };
}

async function fetchProperties(): Promise<DbProperty[]> {
  const { data: rows, error } = await supabase
    .from("properties")
    .select("*")
    .eq("is_visible", true)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = (rows ?? []).map((r) => r.id);
  let imagesByProperty: Record<string, string[]> = {};
  if (ids.length) {
    const { data: imgs } = await supabase
      .from("property_images")
      .select("property_id, image_url, sort_order")
      .in("property_id", ids)
      .order("sort_order", { ascending: true });
    (imgs ?? []).forEach((img: any) => {
      (imagesByProperty[img.property_id] ||= []).push(img.image_url);
    });
  }

  return (rows ?? []).map((r: any) => mapRow(r, imagesByProperty[r.id] ?? []));
}

export function useDbProperties() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("public-properties-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => {
        qc.invalidateQueries({ queryKey: ["db-properties"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "property_images" }, () => {
        qc.invalidateQueries({ queryKey: ["db-properties"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery({
    queryKey: ["db-properties"],
    queryFn: fetchProperties,
    staleTime: 60_000,
  });
}

export function useDbProperty(id: string | undefined) {
  const { data, ...rest } = useDbProperties();
  const property = data?.find((p) => p.id === id || String(p.displayId) === id);
  return { property, ...rest };
}

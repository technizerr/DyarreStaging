import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { WatermarkPreset } from "@/utils/watermark";

export function useWatermarkPresets() {
  const [presets, setPresets] = useState<WatermarkPreset[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("watermark_presets")
      .select("*")
      .order("sequence", { ascending: true });
    setPresets((data as unknown as WatermarkPreset[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { presets, loading, reload: load };
}

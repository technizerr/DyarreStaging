import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BrandingLogos {
  logo_light_bg_url: string;
  logo_dark_bg_url: string;
}

export const DEFAULT_LOGOS: BrandingLogos = {
  logo_light_bg_url:
    "https://iltsthcthnsdclzvbbya.supabase.co/storage/v1/object/public/property-images/branding/logo-light-bg-default.png",
  logo_dark_bg_url:
    "https://iltsthcthnsdclzvbbya.supabase.co/storage/v1/object/public/property-images/branding/logo-dark-bg-default.png",
};

let cached: BrandingLogos | null = null;
let inflight: Promise<BrandingLogos> | null = null;

async function fetchLogos(): Promise<BrandingLogos> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "branding_logos")
      .maybeSingle();
    const v = (data?.value ?? {}) as Partial<BrandingLogos>;
    cached = {
      logo_light_bg_url: v.logo_light_bg_url || DEFAULT_LOGOS.logo_light_bg_url,
      logo_dark_bg_url: v.logo_dark_bg_url || DEFAULT_LOGOS.logo_dark_bg_url,
    };
    return cached;
  })();
  return inflight;
}

export function invalidateBrandingLogos() {
  cached = null;
  inflight = null;
}

export function useBrandingLogos(): BrandingLogos {
  const [logos, setLogos] = useState<BrandingLogos>(cached ?? DEFAULT_LOGOS);
  useEffect(() => {
    let mounted = true;
    fetchLogos().then((l) => mounted && setLogos(l));
    return () => {
      mounted = false;
    };
  }, []);
  return logos;
}

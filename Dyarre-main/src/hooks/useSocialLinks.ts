import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
}

export function useSocialLinks() {
  const [links, setLinks] = useState<SocialLinks>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "social_media")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === "object") {
          setLinks(data.value as SocialLinks);
        }
        setLoading(false);
      });
  }, []);

  const activeLinks = Object.entries(links).filter(([, url]) => url && url.trim() !== "");

  return { links, activeLinks, loading };
}

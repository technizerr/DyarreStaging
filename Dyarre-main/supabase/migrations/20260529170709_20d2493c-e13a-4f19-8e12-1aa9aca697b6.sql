
-- Allow anyone to read only public-safe site_settings keys
CREATE POLICY "Public can read public settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (
  key IN (
    'social_media',
    'meta_pixel',
    'tracking_config',
    'branding',
    'design'
  )
);

GRANT SELECT ON public.site_settings TO anon;

INSERT INTO public.site_settings (key, value)
VALUES ('social_media', '{"instagram":"https://www.instagram.com/dyarree"}'::jsonb)
ON CONFLICT (key) DO UPDATE
SET value = COALESCE(public.site_settings.value, '{}'::jsonb) || '{"instagram":"https://www.instagram.com/dyarree"}'::jsonb,
    updated_at = now();

UPDATE public.site_settings
SET value = COALESCE(value, '{}'::jsonb) || '{"contactEmail":"dyarree@gmail.com"}'::jsonb,
    updated_at = now()
WHERE key = 'design_config';
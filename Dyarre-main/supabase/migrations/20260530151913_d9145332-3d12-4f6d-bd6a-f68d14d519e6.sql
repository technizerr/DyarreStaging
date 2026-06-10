-- 1. property_images soft delete + originals
ALTER TABLE public.property_images
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS original_path text NULL;

CREATE INDEX IF NOT EXISTS idx_property_images_deleted_at ON public.property_images(deleted_at);

-- Replace public SELECT policy to hide soft-deleted rows from non-admins
DROP POLICY IF EXISTS "Anyone can read property_images" ON public.property_images;
CREATE POLICY "Public reads non-deleted images"
ON public.property_images
FOR SELECT
TO anon, authenticated
USING (
  deleted_at IS NULL
  OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
);

-- 2. watermark_presets table
CREATE TABLE IF NOT EXISTS public.watermark_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence int NOT NULL DEFAULT 0,
  name text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('text','reference','sequence','title','price','logo')),
  text_value text,
  logo_url text,
  position_mode text NOT NULL DEFAULT 'anchor' CHECK (position_mode IN ('anchor','percent')),
  anchor text NOT NULL DEFAULT 'c' CHECK (anchor IN ('tl','tc','tr','ml','c','mr','bl','bc','br')),
  offset_x int NOT NULL DEFAULT 0,
  offset_y int NOT NULL DEFAULT 0,
  percent_x numeric NOT NULL DEFAULT 50,
  percent_y numeric NOT NULL DEFAULT 50,
  size_pct numeric NOT NULL DEFAULT 5,
  opacity numeric NOT NULL DEFAULT 0.5,
  rotation int NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#ffffff',
  font_weight text NOT NULL DEFAULT 'bold' CHECK (font_weight IN ('normal','bold')),
  stroke_color text DEFAULT '#000000',
  stroke_width int NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.watermark_presets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watermark_presets TO authenticated;
GRANT ALL ON public.watermark_presets TO service_role;

ALTER TABLE public.watermark_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read watermark_presets"
ON public.watermark_presets FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can insert watermark_presets"
ON public.watermark_presets FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update watermark_presets"
ON public.watermark_presets FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete watermark_presets"
ON public.watermark_presets FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_watermark_presets_updated_at
BEFORE UPDATE ON public.watermark_presets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults reproducing current behavior
INSERT INTO public.watermark_presets (sequence, name, content_type, text_value, position_mode, anchor, size_pct, opacity, color, stroke_color, stroke_width, font_weight)
VALUES
  (1, 'Brand Center', 'text', 'Dyarre.com', 'anchor', 'c', 5, 0.45, '#ffffff', '#000000', 0, 'bold'),
  (2, 'Brand Bottom Right', 'text', 'Dyarre.com', 'anchor', 'br', 2.5, 0.6, '#ffffff', '#000000', 0, 'bold'),
  (3, 'Reference', 'reference', NULL, 'anchor', 'bc', 1.5, 0.85, '#000000', '#ffffff', 2, 'bold');

-- 3. Private originals bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('property-originals','property-originals', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read originals"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'property-originals' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins write originals"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-originals' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins update originals"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'property-originals' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins delete originals"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'property-originals' AND public.has_role(auth.uid(),'admin'));
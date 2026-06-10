
-- Restrict watermark_presets read to admins only
DROP POLICY IF EXISTS "Anyone can read watermark_presets" ON public.watermark_presets;
CREATE POLICY "Admins can read watermark_presets"
ON public.watermark_presets
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Remove permissive anonymous insert on page_visits.
-- The track-visit edge function uses the service role and bypasses RLS,
-- so blocking direct inserts via the anon key prevents tracking-data poisoning.
DROP POLICY IF EXISTS "Anyone can insert visits" ON public.page_visits;

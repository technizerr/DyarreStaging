
DROP POLICY IF EXISTS "Anyone can read settings" ON public.site_settings;

CREATE POLICY "Admins can read settings"
  ON public.site_settings
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

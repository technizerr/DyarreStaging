
-- 1) Remove broad public listing on property-images bucket.
-- Public file URLs (/object/public/...) keep working because they bypass RLS.
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;

-- 2) Replace overly-permissive contact_submissions INSERT policy with input validation.
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_submissions;
CREATE POLICY "Public can submit valid contact"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND length(btrim(name)) BETWEEN 1 AND 100
    AND email IS NOT NULL AND length(email) BETWEEN 3 AND 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND message IS NOT NULL AND length(btrim(message)) BETWEEN 1 AND 2000
    AND (phone IS NULL OR length(phone) <= 32)
  );

-- 3) Lock down SECURITY DEFINER role-check function from anon callers.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

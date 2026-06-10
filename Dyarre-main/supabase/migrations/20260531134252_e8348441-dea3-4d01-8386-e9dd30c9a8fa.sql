CREATE TABLE public.media_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  actor_email text,
  action text NOT NULL,
  property_id uuid,
  image_id uuid,
  bucket text,
  path text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_media_audit_log_created_at ON public.media_audit_log(created_at DESC);
CREATE INDEX idx_media_audit_log_property_id ON public.media_audit_log(property_id);
CREATE INDEX idx_media_audit_log_action ON public.media_audit_log(action);

GRANT SELECT, INSERT ON public.media_audit_log TO authenticated;
GRANT ALL ON public.media_audit_log TO service_role;

ALTER TABLE public.media_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read media audit log"
  ON public.media_audit_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert media audit log"
  ON public.media_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = user_id);
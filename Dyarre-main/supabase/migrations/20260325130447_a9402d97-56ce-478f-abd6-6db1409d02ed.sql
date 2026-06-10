
ALTER TABLE public.contact_submissions
  ADD CONSTRAINT chk_email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$');

ALTER TABLE public.contact_submissions
  ADD CONSTRAINT chk_name_length CHECK (char_length(name) <= 100);

ALTER TABLE public.contact_submissions
  ADD CONSTRAINT chk_message_length CHECK (char_length(message) <= 2000);


-- Add columns to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS reference_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Auto-generate reference_number from display_id
CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := 'DYR-' || LPAD(NEW.display_id::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_reference_number
  BEFORE INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_reference_number();

-- Backfill existing properties
UPDATE public.properties
SET reference_number = 'DYR-' || LPAD(display_id::TEXT, 4, '0')
WHERE reference_number IS NULL;

-- Add columns to page_visits
ALTER TABLE public.page_visits
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS session_duration INTEGER;

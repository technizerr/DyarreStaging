
-- Add auto-increment display_id column to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS display_id SERIAL;

-- Backfill existing rows in creation order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.properties
)
UPDATE public.properties SET display_id = numbered.rn
FROM numbered WHERE public.properties.id = numbered.id;

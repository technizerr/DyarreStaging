-- Reset display_id sequence past existing max and ensure reference_number trigger exists
SELECT setval('properties_display_id_seq', COALESCE((SELECT MAX(display_id) FROM public.properties), 0) + 1, false);

DROP TRIGGER IF EXISTS set_reference_number ON public.properties;
CREATE TRIGGER set_reference_number
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.generate_reference_number();
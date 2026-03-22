-- Drop the broken trigger that references a non-existent updated_at column
DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON public.qr_codes;

-- Fix orphan QR codes: set organization_id from their linked location_element
UPDATE public.qr_codes 
SET organization_id = le.organization_id
FROM public.location_elements le
WHERE qr_codes.location_element_id = le.id
AND qr_codes.organization_id IS NULL
AND le.organization_id IS NOT NULL;
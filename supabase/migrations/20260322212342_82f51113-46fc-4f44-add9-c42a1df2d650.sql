-- Fix legacy QR code slugs that contain "/" which breaks React Router
-- Replace "/" with "-" in target_slug
UPDATE public.qr_codes
SET target_slug = replace(target_slug, '/', '-')
WHERE target_slug LIKE '%/%'
  AND is_active = true;
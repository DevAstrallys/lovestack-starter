
-- Fix qr_codes_public view to use security_invoker
DROP VIEW IF EXISTS public.qr_codes_public;
CREATE VIEW public.qr_codes_public WITH (security_invoker = on) AS
SELECT id, target_slug, form_config, location, display_label, is_active, organization_id, location_element_id, location_group_id, location_ensemble_id
FROM public.qr_codes
WHERE is_active = true AND target_slug IS NOT NULL;

GRANT SELECT ON public.qr_codes_public TO anon;
GRANT SELECT ON public.qr_codes_public TO authenticated;

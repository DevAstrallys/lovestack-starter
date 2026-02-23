
-- Fix tickets_safe view (no qr_code_id column exists)
DROP VIEW IF EXISTS public.tickets_safe;
CREATE VIEW public.tickets_safe WITH (security_invoker = on) AS
SELECT id, title, status, priority, building_id, category_id, object_id, location, meta, attachments, source,
       action_code, category_code, nature_code, created_at, updated_at, assigned_to, created_by,
       closed_at, first_response_at, last_interaction_at, description, duplicate_of, follow_up_of_id,
       initiality, language, communication_mode, sla_due_at, relance_index
FROM public.tickets;

GRANT SELECT ON public.tickets_safe TO authenticated;

-- Drop the view first (depends on the columns we want to remove)
DROP VIEW IF EXISTS public.tickets_safe;

-- Drop the FK constraint on duplicate_of
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_duplicate_of_fkey;

-- Drop the legacy columns
ALTER TABLE public.tickets DROP COLUMN IF EXISTS first_response_at;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS duplicate_of;

-- Recreate tickets_safe without dropped columns
CREATE VIEW public.tickets_safe WITH (security_invoker = on) AS
SELECT 
  id, title, description, status, priority, source,
  category_code, nature_code, action_code,
  category_id, object_id,
  building_id, organization_id, location,
  created_by, assigned_to, duplicate_of_id,
  communication_mode, language,
  initiality, follow_up_of_id, relance_index,
  sla_due_at,
  created_at, updated_at, last_interaction_at,
  first_opened_at, first_responded_at,
  assigned_at, resolved_at, closed_at,
  attachments, meta
FROM public.tickets;
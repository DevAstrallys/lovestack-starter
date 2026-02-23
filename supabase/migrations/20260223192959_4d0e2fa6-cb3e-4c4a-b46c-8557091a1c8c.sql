
-- =============================================
-- FIX 1: QR Codes - Create restricted public view
-- =============================================

-- Create a public-safe view that excludes sensitive fields (created_by, building_id)
CREATE OR REPLACE VIEW public.qr_codes_public AS
SELECT 
  id,
  target_slug,
  form_config,
  location,
  display_label,
  is_active,
  organization_id,
  location_element_id,
  location_group_id,
  location_ensemble_id
FROM public.qr_codes
WHERE is_active = true AND target_slug IS NOT NULL;

-- Grant access to anon and authenticated roles
GRANT SELECT ON public.qr_codes_public TO anon, authenticated;

-- Remove the overly permissive public policy on base table
DROP POLICY IF EXISTS "Public can view active QR codes by slug" ON public.qr_codes;

-- =============================================
-- FIX 2: Tickets - Create view hiding reporter PII
-- =============================================

-- Create a safe view that excludes reporter personal information
CREATE OR REPLACE VIEW public.tickets_safe
WITH (security_invoker = on) AS
SELECT 
  id, title, description, status, priority,
  building_id, category_id, object_id, action_code, category_code, nature_code,
  assigned_to, created_by, created_at, updated_at, closed_at,
  first_response_at, last_interaction_at, sla_due_at,
  location, meta, attachments, source,
  communication_mode, language, initiality, follow_up_of_id, duplicate_of, relance_index
  -- Excludes: reporter_email, reporter_phone, reporter_name
FROM public.tickets;

-- Grant access
GRANT SELECT ON public.tickets_safe TO authenticated;

-- Only managers+ should see reporter PII directly from the tickets table
-- The existing SELECT policies already restrict to creator/assignee/ticket.read permission holders
-- which is appropriate - these users need reporter info to handle tickets
-- The view provides an additional layer for components that don't need PII

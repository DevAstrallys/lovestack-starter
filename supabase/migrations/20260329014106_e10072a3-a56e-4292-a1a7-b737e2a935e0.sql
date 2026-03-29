-- Create a SECURITY DEFINER function to check if user can add ticket activities
-- This bypasses nested RLS issues
CREATE OR REPLACE FUNCTION public.fn_can_add_ticket_activity(p_user_id uuid, p_ticket_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tickets t
    WHERE t.id = p_ticket_id
      AND (
        t.created_by = p_user_id
        OR t.assigned_to = p_user_id
        OR fn_has_perm(p_user_id, t.building_id, 'ticket.write')
        OR EXISTS (
          SELECT 1 FROM memberships m
          JOIN roles r ON r.id = m.role_id
          WHERE m.user_id = p_user_id
            AND m.is_active = true
            AND (
              m.organization_id = t.organization_id
              OR r.code IN ('admin_platform', 'super_admin')
            )
        )
      )
  );
$$;

-- Replace the RLS policy to use the SECURITY DEFINER function
DROP POLICY IF EXISTS "Authorized users can create ticket activities" ON public.ticket_activities;

CREATE POLICY "Authorized users can create ticket activities"
ON public.ticket_activities
FOR INSERT
TO authenticated
WITH CHECK (
  fn_can_add_ticket_activity(auth.uid(), ticket_id)
);
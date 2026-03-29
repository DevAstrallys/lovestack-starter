-- Fix: allow organization members with ticket management roles to insert activities
DROP POLICY IF EXISTS "Authorized users can create ticket activities" ON public.ticket_activities;

CREATE POLICY "Authorized users can create ticket activities"
ON public.ticket_activities
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM tickets t
    WHERE t.id = ticket_activities.ticket_id
      AND (
        t.created_by = auth.uid()
        OR t.assigned_to = auth.uid()
        OR fn_has_perm(auth.uid(), t.building_id, 'ticket.write')
        OR EXISTS (
          SELECT 1 FROM memberships m
          JOIN roles r ON r.id = m.role_id
          WHERE m.user_id = auth.uid()
            AND m.is_active = true
            AND (
              m.organization_id = t.organization_id
              OR r.code IN ('admin_platform', 'super_admin')
            )
        )
      )
  )
);
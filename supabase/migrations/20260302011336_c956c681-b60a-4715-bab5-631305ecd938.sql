-- Platform admins can update all tickets
CREATE POLICY "Platform admins can update all tickets"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN roles r ON r.id = m.role_id
      WHERE m.user_id = (select auth.uid())
        AND m.is_active = true
        AND r.code = 'admin_platform'
        AND r.is_platform_scope = true
    )
  );

-- Organization managers (syndic, gestionnaire, admin_org) can update tickets in their org
CREATE POLICY "Org managers can update tickets of their organization"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN roles r ON r.id = m.role_id
      WHERE m.user_id = (select auth.uid())
        AND m.organization_id = tickets.organization_id
        AND m.is_active = true
        AND r.code IN ('admin_org', 'gestionnaire', 'syndic')
    )
  );
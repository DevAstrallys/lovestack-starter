-- Drop and recreate the INSERT policy to also allow platform-level admins
DROP POLICY IF EXISTS "Organization managers can create location memberships" ON public.location_memberships;

CREATE POLICY "Organization managers can create location memberships"
ON public.location_memberships
FOR INSERT
TO public
WITH CHECK (
  fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'::text)
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.roles r ON r.id = m.role_id
    JOIN public.role_permissions rp ON rp.role_id = r.id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE m.user_id = auth.uid()
      AND m.is_active = true
      AND m.organization_id IS NULL
      AND p.code = 'locations.manage'
  )
);
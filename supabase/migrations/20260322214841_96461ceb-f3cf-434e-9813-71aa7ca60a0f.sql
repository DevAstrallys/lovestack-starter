DROP POLICY IF EXISTS "Users can create QR codes in their organizations" ON public.qr_codes;

CREATE POLICY "Users can create QR codes"
ON public.qr_codes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid()
    AND m.is_active = true
    AND (
      m.organization_id = organization_id
      OR r.code IN ('admin_platform', 'super_admin', 'admin')
    )
  )
);
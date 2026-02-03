-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create QR codes in their organizations" ON public.qr_codes;

-- Create new INSERT policy that also allows platform admins
CREATE POLICY "Users can create QR codes in their organizations" 
ON public.qr_codes 
FOR INSERT 
WITH CHECK (
  -- User has membership in the organization
  organization_id IN (
    SELECT m.organization_id 
    FROM memberships m 
    WHERE m.user_id = auth.uid() AND m.is_active = true
  )
  OR
  -- User is a platform admin
  EXISTS (
    SELECT 1 FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
    AND r.is_platform_scope = true
  )
);
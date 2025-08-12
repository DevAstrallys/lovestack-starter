-- Add INSERT policy for organizations
CREATE POLICY "Platform admins can create organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
      AND m.is_active = true 
      AND r.code = 'admin_platform'
  )
);
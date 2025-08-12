-- Check existing policies and drop conflicting ones
DROP POLICY IF EXISTS "Platform admins can create organizations" ON public.organizations;

-- Recreate the correct policy
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

-- Also add a temporary policy to allow authenticated users to create organizations for testing
CREATE POLICY "Authenticated users can create organizations (temporary)" 
ON public.organizations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);
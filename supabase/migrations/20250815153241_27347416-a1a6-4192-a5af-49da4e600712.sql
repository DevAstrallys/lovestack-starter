-- Fix critical security vulnerability: Restrict organization access to authorized users only

-- Drop the overly permissive policy that allows any authenticated user to view all organizations
DROP POLICY IF EXISTS "Users can view organizations (temporary)" ON public.organizations;

-- Drop the overly permissive creation policy
DROP POLICY IF EXISTS "Authenticated users can create organizations (temporary)" ON public.organizations;

-- Create proper organization access policies
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations 
FOR SELECT 
USING (
  -- Users can see organizations where they have active memberships
  EXISTS (
    SELECT 1 
    FROM memberships m 
    WHERE m.organization_id = organizations.id 
      AND m.user_id = auth.uid() 
      AND m.is_active = true
  )
  OR
  -- Users can see organizations where they have location memberships
  EXISTS (
    SELECT 1 
    FROM location_memberships lm 
    WHERE lm.organization_id = organizations.id 
      AND lm.user_id = auth.uid() 
      AND lm.is_active = true
  )
  OR
  -- Platform admins can see all organizations
  EXISTS (
    SELECT 1
    FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
      AND m.is_active = true 
      AND r.code = 'admin_platform'
  )
);

-- Platform admins and users with organization.create permission can create organizations
CREATE POLICY "Authorized users can create organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (
  -- Platform admins can create organizations
  EXISTS (
    SELECT 1
    FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
      AND m.is_active = true 
      AND r.code = 'admin_platform'
  )
  OR
  -- Users with organization.create permission can create organizations
  EXISTS (
    SELECT 1
    FROM memberships m
    JOIN roles r ON r.id = m.role_id
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE m.user_id = auth.uid() 
      AND m.is_active = true 
      AND p.code = 'organization.create'
  )
);
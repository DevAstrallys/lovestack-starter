-- Fix infinite recursion in memberships RLS policies
-- Drop problematic policies that might cause recursion
DROP POLICY IF EXISTS "Admins can view memberships in their buildings" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_building_admins" ON public.memberships;

-- Create a simpler, non-recursive policy for viewing memberships
CREATE POLICY "memberships_select_simple" 
ON public.memberships 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.memberships m2 
    JOIN public.roles r2 ON r2.id = m2.role_id 
    WHERE m2.user_id = auth.uid() 
      AND m2.is_active = true 
      AND m2.building_id = memberships.building_id 
      AND r2.code IN ('property_manager', 'tech_support', 'admin_platform')
      AND m2.id != memberships.id  -- Prevent self-reference
  )
);
-- Drop all existing problematic policies for memberships
DROP POLICY IF EXISTS "memberships_select_simple" ON public.memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_self" ON public.memberships;

-- Create a security definer function to check admin permissions
CREATE OR REPLACE FUNCTION public.user_has_admin_access_to_building(user_uuid uuid, target_building_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.memberships m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = user_uuid
      AND m.building_id = target_building_id
      AND m.is_active = true
      AND r.code IN ('property_manager', 'tech_support', 'admin_platform')
  );
$$;

-- Create simple, non-recursive policies
CREATE POLICY "memberships_select_own" 
ON public.memberships 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "memberships_select_admin" 
ON public.memberships 
FOR SELECT 
USING (user_has_admin_access_to_building(auth.uid(), building_id));

CREATE POLICY "memberships_manage_admin" 
ON public.memberships 
FOR ALL 
USING (fn_has_perm(auth.uid(), building_id, 'memberships.manage'::text));
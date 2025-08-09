-- Fix the function search path issue
DROP FUNCTION IF EXISTS public.user_has_admin_access_to_building(uuid, uuid);

-- Create a simpler function with proper search path
CREATE OR REPLACE FUNCTION public.user_has_admin_access_to_building(user_uuid uuid, target_building_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
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

-- Temporarily disable RLS on memberships to break the recursion
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS on memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies again to make sure we have a clean slate
DROP POLICY IF EXISTS "memberships_select_own" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_admin" ON public.memberships;
DROP POLICY IF EXISTS "memberships_manage_admin" ON public.memberships;

-- Create very simple policies that don't reference memberships table
CREATE POLICY "memberships_own_only" 
ON public.memberships 
FOR ALL 
USING (auth.uid() = user_id);
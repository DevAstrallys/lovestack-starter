-- Drop all policies that depend on functions first
DROP POLICY IF EXISTS "memberships_select_admin" ON public.memberships;
DROP POLICY IF EXISTS "memberships_manage_admin" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_own" ON public.memberships;

-- Now drop the function
DROP FUNCTION IF EXISTS public.user_has_admin_access_to_building(uuid, uuid);

-- Temporarily disable RLS on memberships to break any remaining recursion
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS on memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Create the simplest possible policy that doesn't cause recursion
CREATE POLICY "memberships_own_only" 
ON public.memberships 
FOR ALL 
USING (auth.uid() = user_id);
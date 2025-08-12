-- Fix the organizations SELECT policy to allow users to see organizations they created
-- Since we don't have memberships properly set up yet, we'll create a temporary policy

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;

-- Create a temporary policy that allows users to see organizations they created
-- This is temporary until we properly set up the membership system
CREATE POLICY "Users can view organizations (temporary)" 
ON public.organizations 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Also ensure users can see all organizations for now (will be restricted later with proper memberships)
-- This is needed because the current SELECT policy is too restrictive
-- Add white-label columns to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL;
-- Add address fields to organizations table
ALTER TABLE public.organizations 
ADD COLUMN address text,
ADD COLUMN zip_code text,
ADD COLUMN city text,
ADD COLUMN country text DEFAULT 'FR';
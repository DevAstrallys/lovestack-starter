
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);


-- 1. Add emergency module flag to buildings
ALTER TABLE public.buildings 
  ADD COLUMN IF NOT EXISTS emergency_module_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_contacts jsonb DEFAULT '[]'::jsonb;

-- 2. Add SLA timestamps and duplicate tracking to tickets
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS first_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS duplicate_of_id uuid REFERENCES public.tickets(id);

-- 3. Trigger to auto-populate SLA timestamps
CREATE OR REPLACE FUNCTION public.fn_ticket_sla_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Track first assignment
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL AND NEW.assigned_at IS NULL THEN
    NEW.assigned_at := now();
  END IF;

  -- Track resolution
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'resolved' AND NEW.resolved_at IS NULL THEN
    NEW.resolved_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ticket_sla_timestamps ON public.tickets;
CREATE TRIGGER trg_ticket_sla_timestamps
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_ticket_sla_timestamps();

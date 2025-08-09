-- CRITICAL SECURITY FIX: Enable RLS and fix functions
-- First drop and recreate the function with proper security

DROP FUNCTION IF EXISTS public.fn_context_covers(uuid,uuid,uuid,uuid,jsonb);

CREATE OR REPLACE FUNCTION public.fn_context_covers(
  membership_block_id uuid,
  membership_entrance_id uuid, 
  membership_floor_id uuid,
  membership_unit_id uuid,
  ticket_location jsonb
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Platform admin can see everything
  IF membership_block_id IS NULL AND membership_entrance_id IS NULL 
     AND membership_floor_id IS NULL AND membership_unit_id IS NULL THEN
    RETURN true;
  END IF;
  
  -- If ticket has no location, only building-level access can see it
  IF ticket_location IS NULL OR ticket_location = '{}' THEN
    RETURN membership_block_id IS NULL AND membership_entrance_id IS NULL 
           AND membership_floor_id IS NULL AND membership_unit_id IS NULL;
  END IF;
  
  -- Check hierarchy: unit -> floor -> entrance -> block -> building
  
  -- Unit level access
  IF membership_unit_id IS NOT NULL THEN
    RETURN (ticket_location->>'unit_id')::uuid = membership_unit_id;
  END IF;
  
  -- Floor level access  
  IF membership_floor_id IS NOT NULL THEN
    RETURN (ticket_location->>'floor_id')::uuid = membership_floor_id;
  END IF;
  
  -- Entrance level access
  IF membership_entrance_id IS NOT NULL THEN
    RETURN (ticket_location->>'entrance_id')::uuid = membership_entrance_id;
  END IF;
  
  -- Block level access
  IF membership_block_id IS NOT NULL THEN
    RETURN (ticket_location->>'block_id')::uuid = membership_block_id;
  END IF;
  
  -- Building level access (all NULLs above)
  RETURN true;
END;
$$;

-- Fix the update function too
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Enable RLS on all tables that don't have it
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
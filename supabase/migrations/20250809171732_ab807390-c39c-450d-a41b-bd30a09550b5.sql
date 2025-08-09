-- CRITICAL SECURITY FIX: Enable RLS on all tables
-- Phase 1: Enable RLS on all remaining tables

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

-- Insert essential data

-- 1. Insert roles
INSERT INTO public.roles (code, label, is_platform_scope) VALUES
('admin_platform', '{"fr": "Administrateur Plateforme", "en": "Platform Administrator"}', true),
('property_manager', '{"fr": "Gestionnaire d''Immeuble", "en": "Property Manager"}', false),
('tech_support', '{"fr": "Support Technique", "en": "Technical Support"}', false),
('resident', '{"fr": "Résident", "en": "Resident"}', false),
('board_member', '{"fr": "Membre du Conseil", "en": "Board Member"}', false)
ON CONFLICT (code) DO NOTHING;

-- 2. Insert permissions
INSERT INTO public.permissions (code, label) VALUES
('building.read', '{"fr": "Voir les informations du bâtiment", "en": "View building information"}'),
('building.write', '{"fr": "Modifier les informations du bâtiment", "en": "Edit building information"}'),
('ticket.read', '{"fr": "Voir les tickets", "en": "View tickets"}'),
('ticket.write', '{"fr": "Créer/modifier des tickets", "en": "Create/edit tickets"}'),
('ticket.assign', '{"fr": "Assigner des tickets", "en": "Assign tickets"}'),
('document.read', '{"fr": "Voir les documents", "en": "View documents"}'),
('document.write', '{"fr": "Créer/modifier des documents", "en": "Create/edit documents"}'),
('survey.read', '{"fr": "Voir les sondages", "en": "View surveys"}'),
('survey.write', '{"fr": "Créer/modifier des sondages", "en": "Create/edit surveys"}'),
('user.read', '{"fr": "Voir les utilisateurs", "en": "View users"}'),
('user.write', '{"fr": "Gérer les utilisateurs", "en": "Manage users"}'),
('company.read', '{"fr": "Voir les entreprises", "en": "View companies"}'),
('company.write', '{"fr": "Gérer les entreprises", "en": "Manage companies"}'),
('contract.read', '{"fr": "Voir les contrats", "en": "View contracts"}'),
('contract.write', '{"fr": "Gérer les contrats", "en": "Manage contracts"}'),
('report.read', '{"fr": "Voir les rapports", "en": "View reports"}'),
('report.write', '{"fr": "Créer des rapports", "en": "Create reports"}'),
('admin.all', '{"fr": "Administration complète", "en": "Full administration"}')
ON CONFLICT (code) DO NOTHING;

-- 3. Create role-permission matrix
WITH role_perms AS (
  SELECT 
    r.id as role_id,
    p.id as permission_id
  FROM roles r
  CROSS JOIN permissions p
  WHERE 
    -- Admin platform: all permissions
    (r.code = 'admin_platform') OR
    -- Property manager: most permissions
    (r.code = 'property_manager' AND p.code IN (
      'building.read', 'building.write', 'ticket.read', 'ticket.write', 'ticket.assign',
      'document.read', 'document.write', 'survey.read', 'survey.write',
      'user.read', 'user.write', 'company.read', 'contract.read', 'report.read', 'report.write'
    )) OR
    -- Tech support: tickets and technical docs
    (r.code = 'tech_support' AND p.code IN (
      'building.read', 'ticket.read', 'ticket.write', 'ticket.assign',
      'document.read', 'company.read', 'contract.read'
    )) OR
    -- Resident: basic read access
    (r.code = 'resident' AND p.code IN (
      'building.read', 'ticket.read', 'ticket.write', 'document.read', 'survey.read'
    )) OR
    -- Board member: similar to residents but can see more
    (r.code = 'board_member' AND p.code IN (
      'building.read', 'ticket.read', 'ticket.write', 'document.read', 'document.write',
      'survey.read', 'user.read', 'report.read'
    ))
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT role_id, permission_id FROM role_perms
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Insert modules
INSERT INTO public.modules (code, label) VALUES
('ticketing', '{"fr": "Gestion des Tickets", "en": "Ticket Management"}'),
('documents', '{"fr": "Gestion Documentaire", "en": "Document Management"}'),
('surveys', '{"fr": "Sondages", "en": "Surveys"}'),
('reporting', '{"fr": "Rapports", "en": "Reporting"}'),
('access_control', '{"fr": "Contrôle d''Accès", "en": "Access Control"}'),
('maintenance', '{"fr": "Maintenance", "en": "Maintenance"}'),
('communication', '{"fr": "Communication", "en": "Communication"}')
ON CONFLICT (code) DO NOTHING;

-- Fix function security (set search_path)
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
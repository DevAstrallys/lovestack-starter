-- Add hierarchy columns to roles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'parent_id') THEN
    ALTER TABLE public.roles ADD COLUMN parent_id UUID REFERENCES public.roles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'is_active') THEN
    ALTER TABLE public.roles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'sort_order') THEN
    ALTER TABLE public.roles ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'description') THEN
    ALTER TABLE public.roles ADD COLUMN description TEXT;
  END IF;
END $$;

-- Archive existing roles that don't match the new hierarchy
UPDATE public.roles 
SET is_active = false, description = 'Rôle archivé - remplacé par nouvelle hiérarchie'
WHERE code NOT IN ('admin_platform', 'admin_organization');

-- Create the exact role hierarchy from the image
-- Platform Roles
INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description) VALUES
('super_admin', '{"fr": "Super Administrateur", "en": "Super Admin"}', true, 1, 'Administrateur super avec tous les droits plateforme')
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('admin', '{"fr": "Administrateur", "en": "Admin"}', true, 2, 'Administrateur plateforme', 
 (SELECT id FROM public.roles WHERE code = 'super_admin'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('gestionnaire_logiciel', '{"fr": "Gestionnaire logiciel", "en": "Software Manager"}', true, 3, 'Gestionnaire du logiciel', 
 (SELECT id FROM public.roles WHERE code = 'admin'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('tech_logiciel', '{"fr": "Technicien logiciel", "en": "Software Technician"}', true, 4, 'Technicien du logiciel', 
 (SELECT id FROM public.roles WHERE code = 'admin'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

-- User Roles Hierarchy
-- Root: Gestionnaire
INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description) VALUES
('gestionnaire', '{"fr": "Gestionnaire", "en": "Manager"}', false, 10, 'Gestionnaire principal')
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  is_active = true;

-- Children of Gestionnaire
INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('syndic', '{"fr": "Syndic", "en": "Property Manager"}', false, 11, 'Syndic de copropriété', 
 (SELECT id FROM public.roles WHERE code = 'gestionnaire'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('conseil_syndical', '{"fr": "Membre du Conseil Syndical", "en": "Syndicate Council Member"}', false, 12, 'Membre du conseil syndical', 
 (SELECT id FROM public.roles WHERE code = 'gestionnaire'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('gestionnaire_biens', '{"fr": "Gestionnaire de biens", "en": "Property Manager"}', false, 13, 'Gestionnaire de biens immobiliers', 
 (SELECT id FROM public.roles WHERE code = 'gestionnaire'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('comptable', '{"fr": "Comptable", "en": "Accountant"}', false, 14, 'Comptable', 
 (SELECT id FROM public.roles WHERE code = 'gestionnaire'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('assistant', '{"fr": "Assistant", "en": "Assistant"}', false, 15, 'Assistant administratif', 
 (SELECT id FROM public.roles WHERE code = 'gestionnaire'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('juridique', '{"fr": "Juridique", "en": "Legal"}', false, 16, 'Service juridique', 
 (SELECT id FROM public.roles WHERE code = 'gestionnaire'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('gestion_locative', '{"fr": "Gestion locative", "en": "Rental Management"}', false, 17, 'Gestion locative', 
 (SELECT id FROM public.roles WHERE code = 'gestionnaire'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

-- Root: Résident
INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description) VALUES
('resident', '{"fr": "Résident", "en": "Resident"}', false, 20, 'Résident de l\'immeuble')
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  is_active = true;

-- Children of Résident
INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('proprietaire', '{"fr": "Propriétaire", "en": "Owner"}', false, 21, 'Propriétaire d\'un bien', 
 (SELECT id FROM public.roles WHERE code = 'resident'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('locataire', '{"fr": "Locataire", "en": "Tenant"}', false, 22, 'Locataire d\'un bien', 
 (SELECT id FROM public.roles WHERE code = 'resident'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('gardien', '{"fr": "Gardien", "en": "Caretaker"}', false, 23, 'Gardien de l\'immeuble', 
 (SELECT id FROM public.roles WHERE code = 'resident'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

-- Root: Externe
INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description) VALUES
('externe', '{"fr": "Externe", "en": "External"}', false, 30, 'Personne externe à l\'immeuble')
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  is_active = true;

-- Children of Externe
INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('proprietaire_bailleur', '{"fr": "Propriétaire Bailleur", "en": "Landlord"}', false, 31, 'Propriétaire bailleur', 
 (SELECT id FROM public.roles WHERE code = 'externe'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('prestataire', '{"fr": "Prestataire", "en": "Service Provider"}', false, 32, 'Prestataire de services', 
 (SELECT id FROM public.roles WHERE code = 'externe'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('technicien_prestataire', '{"fr": "Technicien prestataire", "en": "External Technician"}', false, 33, 'Technicien prestataire', 
 (SELECT id FROM public.roles WHERE code = 'prestataire'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('technicien', '{"fr": "Technicien", "en": "Technician"}', false, 34, 'Technicien général', 
 (SELECT id FROM public.roles WHERE code = 'prestataire'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('maintenance', '{"fr": "Maintenance", "en": "Maintenance"}', false, 35, 'Service de maintenance', 
 (SELECT id FROM public.roles WHERE code = 'prestataire'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('urgence', '{"fr": "Urgence", "en": "Emergency"}', false, 36, 'Service d\'urgence', 
 (SELECT id FROM public.roles WHERE code = 'prestataire'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('visiteur', '{"fr": "Visiteur", "en": "Visitor"}', false, 37, 'Visiteur', 
 (SELECT id FROM public.roles WHERE code = 'externe'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('consultant', '{"fr": "Consultant", "en": "Consultant"}', false, 38, 'Consultant externe', 
 (SELECT id FROM public.roles WHERE code = 'externe'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('expert', '{"fr": "Expert", "en": "Expert"}', false, 39, 'Expert technique', 
 (SELECT id FROM public.roles WHERE code = 'externe'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('auditeur', '{"fr": "Auditeur", "en": "Auditor"}', false, 40, 'Auditeur', 
 (SELECT id FROM public.roles WHERE code = 'externe'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('assurance', '{"fr": "Assurance", "en": "Insurance"}', false, 41, 'Compagnie d\'assurance', 
 (SELECT id FROM public.roles WHERE code = 'externe'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('notaire', '{"fr": "Notaire", "en": "Notary"}', false, 42, 'Notaire', 
 (SELECT id FROM public.roles WHERE code = 'externe'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('invite', '{"fr": "Invité", "en": "Guest"}', false, 43, 'Invité', 
 (SELECT id FROM public.roles WHERE code = 'externe'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('partenaire', '{"fr": "Partenaire", "en": "Partner"}', false, 44, 'Partenaire', 
 (SELECT id FROM public.roles WHERE code = 'externe'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

-- Root: Services Publics
INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description) VALUES
('services_publics', '{"fr": "Services Publics", "en": "Public Services"}', false, 50, 'Services publics')
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  is_active = true;

-- Children of Services Publics
INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('pompier', '{"fr": "Pompier", "en": "Firefighter"}', false, 51, 'Service des pompiers', 
 (SELECT id FROM public.roles WHERE code = 'services_publics'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, parent_id) VALUES
('police', '{"fr": "Police", "en": "Police"}', false, 52, 'Service de police', 
 (SELECT id FROM public.roles WHERE code = 'services_publics'))
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = true;

-- Archive role
INSERT INTO public.roles (code, label, is_platform_scope, sort_order, description, is_active) VALUES
('archive', '{"fr": "Archive", "en": "Archive"}', false, 60, 'Rôles archivés', false)
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  is_platform_scope = EXCLUDED.is_platform_scope,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;
-- Ajouter les permissions nécessaires pour la gestion des lieux
-- Car les policies font référence à ces permissions qui n'existent peut-être pas

-- 1. Permissions pour la gestion des organisations
INSERT INTO public.permissions (code, label) VALUES 
('organization.manage', '{"fr": "Gérer l''organisation", "en": "Manage organization"}')
ON CONFLICT (code) DO NOTHING;

-- 2. Permissions pour la gestion des lieux
INSERT INTO public.permissions (code, label) VALUES 
('locations.read', '{"fr": "Voir les lieux", "en": "View locations"}'),
('locations.manage', '{"fr": "Gérer les lieux", "en": "Manage locations"}')
ON CONFLICT (code) DO NOTHING;

-- 3. Assurer qu'il y a un rôle admin avec toutes les permissions
-- D'abord, créer un rôle admin_organization s'il n'existe pas
INSERT INTO public.roles (code, label, is_platform_scope) VALUES 
('admin_organization', '{"fr": "Administrateur Organisation", "en": "Organization Administrator"}', false)
ON CONFLICT (code) DO NOTHING;

-- Puis associer les permissions au rôle admin_organization
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.code = 'admin_organization' 
AND p.code IN ('organization.manage', 'locations.read', 'locations.manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Créer un membership par défaut pour l'admin avec l'organisation par défaut
-- (seulement s'il n'y a pas encore de memberships pour cette organisation)
DO $$
DECLARE
    default_org_id UUID;
    admin_role_id UUID;
    first_user_id UUID;
BEGIN
    -- Récupérer l'ID de l'organisation par défaut
    SELECT id INTO default_org_id FROM public.organizations LIMIT 1;
    
    -- Récupérer l'ID du rôle admin_organization
    SELECT id INTO admin_role_id FROM public.roles WHERE code = 'admin_organization';
    
    -- Récupérer le premier utilisateur de la table profiles
    SELECT id INTO first_user_id FROM public.profiles LIMIT 1;
    
    -- Créer le membership seulement si tous les éléments existent et qu'aucun membership n'existe pour cette organisation
    IF default_org_id IS NOT NULL AND admin_role_id IS NOT NULL AND first_user_id IS NOT NULL THEN
        INSERT INTO public.memberships (user_id, organization_id, role_id, is_active)
        SELECT first_user_id, default_org_id, admin_role_id, true
        WHERE NOT EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE organization_id = default_org_id
        );
    END IF;
END $$;
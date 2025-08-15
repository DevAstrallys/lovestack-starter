-- Create test data for organizations, roles, and user memberships
-- This will allow the user to see their created elements

-- Insert basic roles if they don't exist
INSERT INTO public.roles (code, label, description, is_platform_scope) 
VALUES 
  ('admin_platform', '{"fr": "Administrateur Plateforme", "en": "Platform Administrator"}', 'Full platform access', true),
  ('admin_org', '{"fr": "Administrateur Organisation", "en": "Organization Administrator"}', 'Organization management', false),
  ('manager', '{"fr": "Gestionnaire", "en": "Manager"}', 'Management access', false),
  ('user', '{"fr": "Utilisateur", "en": "User"}', 'Basic user access', false)
ON CONFLICT (code) DO NOTHING;

-- Insert basic permissions if they don't exist
INSERT INTO public.permissions (code, label) 
VALUES 
  ('organization.create', '{"fr": "Créer des organisations", "en": "Create organizations"}'),
  ('organization.manage', '{"fr": "Gérer les organisations", "en": "Manage organizations"}'),
  ('locations.read', '{"fr": "Voir les lieux", "en": "View locations"}'),
  ('locations.manage', '{"fr": "Gérer les lieux", "en": "Manage locations"}')
ON CONFLICT (code) DO NOTHING;

-- Link platform admin role to all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code = 'admin_platform'
ON CONFLICT DO NOTHING;

-- Give the current authenticated user platform admin access if they don't have a membership
-- This will allow them to see and manage all data
INSERT INTO public.memberships (user_id, role_id, is_active)
SELECT 
  auth.uid(),
  r.id,
  true
FROM public.roles r
WHERE r.code = 'admin_platform'
  AND auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.user_id = auth.uid() AND m.is_active = true
  )
ON CONFLICT DO NOTHING;
-- Créer les rôles nécessaires s'ils n'existent pas
INSERT INTO roles (code, label, description, is_platform_scope, is_active)
VALUES 
  ('admin_platform', '{"fr": "Admin Plateforme", "en": "Platform Admin"}', 'Administrateur de la plateforme', true, true),
  ('admin', '{"fr": "Administrateur", "en": "Administrator"}', 'Administrateur d''organisation', false, true),
  ('manager', '{"fr": "Gestionnaire", "en": "Manager"}', 'Gestionnaire de lieu', false, true),
  ('user', '{"fr": "Utilisateur", "en": "User"}', 'Utilisateur standard', false, true)
ON CONFLICT (code) DO NOTHING;

-- Récupérer l'utilisateur actuel et les organisations existantes
WITH current_user AS (
  SELECT auth.uid() as user_id
),
platform_admin_role AS (
  SELECT id FROM roles WHERE code = 'admin_platform'
),
admin_role AS (
  SELECT id FROM roles WHERE code = 'admin'
),
existing_orgs AS (
  SELECT id, name FROM organizations LIMIT 5
)
-- Créer un membership plateforme admin pour l'utilisateur actuel
INSERT INTO memberships (user_id, role_id, is_active)
SELECT 
  cu.user_id,
  par.id,
  true
FROM current_user cu, platform_admin_role par
ON CONFLICT DO NOTHING;

-- Créer des memberships admin pour chaque organisation existante
WITH current_user AS (
  SELECT auth.uid() as user_id
),
admin_role AS (
  SELECT id FROM roles WHERE code = 'admin'
),
existing_orgs AS (
  SELECT id FROM organizations
)
INSERT INTO memberships (user_id, role_id, organization_id, is_active)
SELECT 
  cu.user_id,
  ar.id,
  eo.id,
  true
FROM current_user cu, admin_role ar, existing_orgs eo
ON CONFLICT DO NOTHING;
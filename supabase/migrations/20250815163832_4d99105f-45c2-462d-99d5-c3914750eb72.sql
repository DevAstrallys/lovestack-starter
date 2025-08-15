-- Créer les rôles nécessaires s'ils n'existent pas
INSERT INTO roles (code, label, description, is_platform_scope, is_active)
VALUES 
  ('admin_platform', '{"fr": "Admin Plateforme", "en": "Platform Admin"}', 'Administrateur de la plateforme', true, true),
  ('admin', '{"fr": "Administrateur", "en": "Administrator"}', 'Administrateur d''organisation', false, true),
  ('manager', '{"fr": "Gestionnaire", "en": "Manager"}', 'Gestionnaire de lieu', false, true),
  ('user', '{"fr": "Utilisateur", "en": "User"}', 'Utilisateur standard', false, true)
ON CONFLICT (code) DO NOTHING;

-- Créer un membership plateforme admin pour l'utilisateur actuel
INSERT INTO memberships (user_id, role_id, is_active)
SELECT 
  auth.uid(),
  r.id,
  true
FROM roles r
WHERE r.code = 'admin_platform'
ON CONFLICT DO NOTHING;

-- Créer des memberships admin pour chaque organisation existante
INSERT INTO memberships (user_id, role_id, organization_id, is_active)
SELECT 
  auth.uid(),
  r.id,
  o.id,
  true
FROM roles r, organizations o
WHERE r.code = 'admin'
ON CONFLICT DO NOTHING;
-- Corriger le problème de permissions pour l'utilisateur principal
-- auth.uid() ne fonctionne pas en contexte de migration, utilisons l'ID direct

-- Créer un membership plateforme admin pour l'utilisateur
INSERT INTO memberships (user_id, role_id, is_active)
SELECT 
  '6d2fd9ef-bdc0-4609-be3b-a252a0b22199'::uuid,
  r.id,
  true
FROM roles r
WHERE r.code = 'admin_platform'
ON CONFLICT (user_id, role_id, organization_id) DO UPDATE SET is_active = true;

-- Créer des memberships admin pour chaque organisation existante
INSERT INTO memberships (user_id, role_id, organization_id, is_active)
SELECT 
  '6d2fd9ef-bdc0-4609-be3b-a252a0b22199'::uuid,
  r.id,
  o.id,
  true
FROM roles r
CROSS JOIN organizations o
WHERE r.code = 'admin'
ON CONFLICT (user_id, role_id, organization_id) DO UPDATE SET is_active = true;
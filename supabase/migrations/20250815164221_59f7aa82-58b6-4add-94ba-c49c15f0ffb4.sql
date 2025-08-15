-- Solution simple: insérer directement les memberships nécessaires
-- Supprimer d'abord les anciens memberships pour éviter les conflits
DELETE FROM memberships WHERE user_id = '6d2fd9ef-bdc0-4609-be3b-a252a0b22199';

-- Insérer le membership plateforme admin
INSERT INTO memberships (user_id, role_id, is_active)
SELECT 
  '6d2fd9ef-bdc0-4609-be3b-a252a0b22199'::uuid,
  r.id,
  true
FROM roles r
WHERE r.code = 'admin_platform';

-- Insérer les memberships admin pour chaque organisation existante
INSERT INTO memberships (user_id, role_id, organization_id, is_active)
SELECT 
  '6d2fd9ef-bdc0-4609-be3b-a252a0b22199'::uuid,
  r.id,
  o.id,
  true
FROM roles r
CROSS JOIN organizations o
WHERE r.code = 'admin';
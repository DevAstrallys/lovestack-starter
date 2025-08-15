-- Corriger la structure de memberships et ajouter les permissions
-- D'abord ajouter la contrainte unique manquante
ALTER TABLE memberships ADD CONSTRAINT memberships_unique_constraint 
UNIQUE (user_id, role_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Maintenant insérer les memberships avec la bonne contrainte
INSERT INTO memberships (user_id, role_id, is_active)
SELECT 
  '6d2fd9ef-bdc0-4609-be3b-a252a0b22199'::uuid,
  r.id,
  true
FROM roles r
WHERE r.code = 'admin_platform'
ON CONFLICT ON CONSTRAINT memberships_unique_constraint DO UPDATE SET is_active = true;

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
ON CONFLICT ON CONSTRAINT memberships_unique_constraint DO UPDATE SET is_active = true;
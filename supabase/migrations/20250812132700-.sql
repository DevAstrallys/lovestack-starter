-- Create profile for the authenticated user (from auth logs: fbd4b19b-c43f-4cea-9db8-1a871cdfd987)
INSERT INTO profiles (id, full_name, locale) 
VALUES ('fbd4b19b-c43f-4cea-9db8-1a871cdfd987', 'Frédéric LORGEOUX', 'fr')
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  locale = EXCLUDED.locale;

-- Get the admin platform role and example org
WITH admin_role AS (
  SELECT id FROM roles WHERE code = 'admin_platform' LIMIT 1
),
example_org AS (
  SELECT id FROM organizations WHERE name = 'Organisation Exemple' LIMIT 1
)
-- Create membership for the user as platform admin
INSERT INTO memberships (user_id, role_id, organization_id, is_active)
SELECT 'fbd4b19b-c43f-4cea-9db8-1a871cdfd987', admin_role.id, example_org.id, true
FROM admin_role, example_org
ON CONFLICT DO NOTHING;
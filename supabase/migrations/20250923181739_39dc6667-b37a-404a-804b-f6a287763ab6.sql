-- Mise à jour des politiques RLS pour permettre aux admin plateforme de voir toutes les données

-- Politique pour location_elements : permettre aux admin plateforme de tout voir
DROP POLICY IF EXISTS "Users can view elements for their organizations" ON location_elements;
CREATE POLICY "Users can view elements for their organizations" ON location_elements FOR SELECT USING (
  fn_has_org_perm(auth.uid(), organization_id, 'locations.read'::text) OR 
  EXISTS (
    SELECT 1 FROM memberships m 
    JOIN roles r ON r.id = m.role_id 
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
    AND r.is_platform_scope = true
  )
);

-- Politique pour location_elements : permettre aux admin plateforme de tout gérer
DROP POLICY IF EXISTS "Users can manage elements for their organizations" ON location_elements;
CREATE POLICY "Users can manage elements for their organizations" ON location_elements FOR ALL USING (
  fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'::text) OR 
  EXISTS (
    SELECT 1 FROM memberships m 
    JOIN roles r ON r.id = m.role_id 
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
    AND r.is_platform_scope = true
  )
);

-- Politique pour location_tags : permettre aux admin plateforme de tout voir
DROP POLICY IF EXISTS "Users can view tags for their organizations" ON location_tags;
CREATE POLICY "Users can view tags for their organizations" ON location_tags FOR SELECT USING (
  fn_has_org_perm(auth.uid(), organization_id, 'locations.read'::text) OR 
  EXISTS (
    SELECT 1 FROM memberships m 
    JOIN roles r ON r.id = m.role_id 
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
    AND r.is_platform_scope = true
  )
);

-- Politique pour location_tags : permettre aux admin plateforme de tout gérer
DROP POLICY IF EXISTS "Users can manage tags for their organizations" ON location_tags;
CREATE POLICY "Users can manage tags for their organizations" ON location_tags FOR ALL USING (
  fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'::text) OR 
  EXISTS (
    SELECT 1 FROM memberships m 
    JOIN roles r ON r.id = m.role_id 
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
    AND r.is_platform_scope = true
  )
);

-- Politique pour location_groups : permettre aux admin plateforme de tout voir
DROP POLICY IF EXISTS "Users can view groups for their organizations" ON location_groups;
CREATE POLICY "Users can view groups for their organizations" ON location_groups FOR SELECT USING (
  fn_has_org_perm(auth.uid(), organization_id, 'locations.read'::text) OR 
  EXISTS (
    SELECT 1 FROM memberships m 
    JOIN roles r ON r.id = m.role_id 
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
    AND r.is_platform_scope = true
  )
);

-- Politique pour location_groups : permettre aux admin plateforme de tout gérer
DROP POLICY IF EXISTS "Users can manage groups for their organizations" ON location_groups;
CREATE POLICY "Users can manage groups for their organizations" ON location_groups FOR ALL USING (
  fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'::text) OR 
  EXISTS (
    SELECT 1 FROM memberships m 
    JOIN roles r ON r.id = m.role_id 
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
    AND r.is_platform_scope = true
  )
);

-- Politique pour location_ensembles : permettre aux admin plateforme de tout voir
DROP POLICY IF EXISTS "Users can view ensembles for their organizations" ON location_ensembles;
CREATE POLICY "Users can view ensembles for their organizations" ON location_ensembles FOR SELECT USING (
  fn_has_org_perm(auth.uid(), organization_id, 'locations.read'::text) OR 
  EXISTS (
    SELECT 1 FROM memberships m 
    JOIN roles r ON r.id = m.role_id 
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
    AND r.is_platform_scope = true
  )
);

-- Politique pour location_ensembles : permettre aux admin plateforme de tout gérer
DROP POLICY IF EXISTS "Users can manage ensembles for their organizations" ON location_ensembles;
CREATE POLICY "Users can manage ensembles for their organizations" ON location_ensembles FOR ALL USING (
  fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'::text) OR 
  EXISTS (
    SELECT 1 FROM memberships m 
    JOIN roles r ON r.id = m.role_id 
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
    AND r.is_platform_scope = true
  )
);

-- Politiques pour les tables de relations (location_element_tags, location_group_elements, etc.)
-- Ces politiques utilisent des EXISTS sur les tables parentes, donc elles hériteront automatiquement des nouvelles permissions
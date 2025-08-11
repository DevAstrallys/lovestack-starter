-- Ajouter les policies RLS pour toutes les tables de location et organisations
-- Car elles ont été créées avec RLS activé mais sans policies

-- 1. Policies pour organizations
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.organization_id = organizations.id 
    AND m.user_id = auth.uid() 
    AND m.is_active = true
  )
);

CREATE POLICY "Organization managers can update organizations" 
ON public.organizations FOR UPDATE 
USING (fn_has_org_perm(auth.uid(), id, 'organization.manage'));

-- 2. Policies pour location_elements
CREATE POLICY "Users can view elements for their organizations" 
ON public.location_elements FOR SELECT 
USING (fn_has_org_perm(auth.uid(), organization_id, 'locations.read'));

CREATE POLICY "Users can manage elements for their organizations" 
ON public.location_elements FOR ALL 
USING (fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'));

-- 3. Policies pour location_groups
CREATE POLICY "Users can view groups for their organizations" 
ON public.location_groups FOR SELECT 
USING (fn_has_org_perm(auth.uid(), organization_id, 'locations.read'));

CREATE POLICY "Users can manage groups for their organizations" 
ON public.location_groups FOR ALL 
USING (fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'));

-- 4. Policies pour location_ensembles
CREATE POLICY "Users can view ensembles for their organizations" 
ON public.location_ensembles FOR SELECT 
USING (fn_has_org_perm(auth.uid(), organization_id, 'locations.read'));

CREATE POLICY "Users can manage ensembles for their organizations" 
ON public.location_ensembles FOR ALL 
USING (fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'));

-- 5. Policies pour location_tags
CREATE POLICY "Users can view tags for their organizations" 
ON public.location_tags FOR SELECT 
USING (fn_has_org_perm(auth.uid(), organization_id, 'locations.read'));

CREATE POLICY "Users can manage tags for their organizations" 
ON public.location_tags FOR ALL 
USING (fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'));

-- 6. Policies pour junction tables
CREATE POLICY "Users can view element tags for their organizations" 
ON public.location_element_tags FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.location_elements le 
    WHERE le.id = location_element_tags.element_id 
    AND fn_has_org_perm(auth.uid(), le.organization_id, 'locations.read')
  )
);

CREATE POLICY "Users can manage element tags for their organizations" 
ON public.location_element_tags FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.location_elements le 
    WHERE le.id = location_element_tags.element_id 
    AND fn_has_org_perm(auth.uid(), le.organization_id, 'locations.manage')
  )
);

CREATE POLICY "Users can view group elements for their organizations" 
ON public.location_group_elements FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.location_groups lg 
    WHERE lg.id = location_group_elements.group_id 
    AND fn_has_org_perm(auth.uid(), lg.organization_id, 'locations.read')
  )
);

CREATE POLICY "Users can manage group elements for their organizations" 
ON public.location_group_elements FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.location_groups lg 
    WHERE lg.id = location_group_elements.group_id 
    AND fn_has_org_perm(auth.uid(), lg.organization_id, 'locations.manage')
  )
);

CREATE POLICY "Users can view group tags for their organizations" 
ON public.location_group_tags FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.location_groups lg 
    WHERE lg.id = location_group_tags.group_id 
    AND fn_has_org_perm(auth.uid(), lg.organization_id, 'locations.read')
  )
);

CREATE POLICY "Users can manage group tags for their organizations" 
ON public.location_group_tags FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.location_groups lg 
    WHERE lg.id = location_group_tags.group_id 
    AND fn_has_org_perm(auth.uid(), lg.organization_id, 'locations.manage')
  )
);

CREATE POLICY "Users can view ensemble groups for their organizations" 
ON public.location_ensemble_groups FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.location_ensembles le 
    WHERE le.id = location_ensemble_groups.ensemble_id 
    AND fn_has_org_perm(auth.uid(), le.organization_id, 'locations.read')
  )
);

CREATE POLICY "Users can manage ensemble groups for their organizations" 
ON public.location_ensemble_groups FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.location_ensembles le 
    WHERE le.id = location_ensemble_groups.ensemble_id 
    AND fn_has_org_perm(auth.uid(), le.organization_id, 'locations.manage')
  )
);

CREATE POLICY "Users can view ensemble tags for their organizations" 
ON public.location_ensemble_tags FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.location_ensembles le 
    WHERE le.id = location_ensemble_tags.ensemble_id 
    AND fn_has_org_perm(auth.uid(), le.organization_id, 'locations.read')
  )
);

CREATE POLICY "Users can manage ensemble tags for their organizations" 
ON public.location_ensemble_tags FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.location_ensembles le 
    WHERE le.id = location_ensemble_tags.ensemble_id 
    AND fn_has_org_perm(auth.uid(), le.organization_id, 'locations.manage')
  )
);
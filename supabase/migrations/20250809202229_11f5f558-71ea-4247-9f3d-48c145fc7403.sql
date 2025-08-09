-- REFONTE COMPLÈTE: Remplacement de "buildings" par la hiérarchie Éléments → Groupements → Ensembles

-- 1. Créer une nouvelle table "organizations" pour remplacer "buildings" comme contexte principal
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Modifier la table location_elements pour être autonome (sans building_id)
ALTER TABLE public.location_elements DROP COLUMN building_id;
ALTER TABLE public.location_elements ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 3. Modifier location_groups pour référencer organization_id
ALTER TABLE public.location_groups DROP COLUMN building_id;
ALTER TABLE public.location_groups ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 4. Modifier location_ensembles pour référencer organization_id
ALTER TABLE public.location_ensembles DROP COLUMN building_id;
ALTER TABLE public.location_ensembles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 5. Modifier location_tags pour référencer organization_id
ALTER TABLE public.location_tags DROP COLUMN building_id;
ALTER TABLE public.location_tags ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 6. Modifier memberships pour référencer organization_id au lieu de building_id
ALTER TABLE public.memberships DROP COLUMN building_id;
ALTER TABLE public.memberships ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Supprimer les colonnes de hiérarchie physique obsolètes
ALTER TABLE public.memberships DROP COLUMN block_id;
ALTER TABLE public.memberships DROP COLUMN entrance_id;
ALTER TABLE public.memberships DROP COLUMN floor_id;
ALTER TABLE public.memberships DROP COLUMN unit_id;

-- 7. Créer une nouvelle fonction de permissions basée sur organization_id
CREATE OR REPLACE FUNCTION public.fn_has_org_perm(uid uuid, org_id uuid, perm_code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.memberships m
    join public.roles r on r.id = m.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where m.user_id = uid
      and m.organization_id = org_id
      and m.is_active
      and p.code = perm_code
  );
$function$;

-- 8. Nouvelles RLS policies pour organizations
CREATE POLICY "Users can view their organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (id IN (
  SELECT m.organization_id
  FROM memberships m
  WHERE m.user_id = auth.uid() AND m.is_active = true
));

CREATE POLICY "Admins can manage organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (fn_has_org_perm(auth.uid(), id, 'organization.manage'));

-- 9. Nouvelles RLS policies pour location_elements
DROP POLICY IF EXISTS "Users can view elements for their buildings" ON public.location_elements;
DROP POLICY IF EXISTS "Users can manage elements for their buildings" ON public.location_elements;

CREATE POLICY "Users can view elements for their organizations"
ON public.location_elements
FOR SELECT
TO authenticated
USING (organization_id IN (
  SELECT m.organization_id
  FROM memberships m
  WHERE m.user_id = auth.uid() AND m.is_active = true
));

CREATE POLICY "Users can manage elements for their organizations"
ON public.location_elements
FOR ALL
TO authenticated
USING (fn_has_org_perm(auth.uid(), organization_id, 'location.manage'));

-- 10. Nouvelles RLS policies pour location_groups
DROP POLICY IF EXISTS "Users can view groups for their buildings" ON public.location_groups;
DROP POLICY IF EXISTS "Users can manage groups for their buildings" ON public.location_groups;

CREATE POLICY "Users can view groups for their organizations"
ON public.location_groups
FOR SELECT
TO authenticated
USING (organization_id IN (
  SELECT m.organization_id
  FROM memberships m
  WHERE m.user_id = auth.uid() AND m.is_active = true
));

CREATE POLICY "Users can manage groups for their organizations"
ON public.location_groups
FOR ALL
TO authenticated
USING (fn_has_org_perm(auth.uid(), organization_id, 'location.manage'));

-- 11. Nouvelles RLS policies pour location_ensembles
DROP POLICY IF EXISTS "Users can view ensembles for their buildings" ON public.location_ensembles;
DROP POLICY IF EXISTS "Users can manage ensembles for their buildings" ON public.location_ensembles;

CREATE POLICY "Users can view ensembles for their organizations"
ON public.location_ensembles
FOR SELECT
TO authenticated
USING (organization_id IN (
  SELECT m.organization_id
  FROM memberships m
  WHERE m.user_id = auth.uid() AND m.is_active = true
));

CREATE POLICY "Users can manage ensembles for their organizations"
ON public.location_ensembles
FOR ALL
TO authenticated
USING (fn_has_org_perm(auth.uid(), organization_id, 'location.manage'));

-- 12. Nouvelles RLS policies pour location_tags
DROP POLICY IF EXISTS "Users can view tags for their buildings" ON public.location_tags;
DROP POLICY IF EXISTS "Users can manage tags for their buildings" ON public.location_tags;

CREATE POLICY "Users can view tags for their organizations"
ON public.location_tags
FOR SELECT
TO authenticated
USING (organization_id IN (
  SELECT m.organization_id
  FROM memberships m
  WHERE m.user_id = auth.uid() AND m.is_active = true
));

CREATE POLICY "Users can manage tags for their organizations"
ON public.location_tags
FOR ALL
TO authenticated
USING (fn_has_org_perm(auth.uid(), organization_id, 'location.manage'));

-- 13. Mettre à jour les triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Supprimer les anciennes tables physiques devenues obsolètes
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.floors CASCADE;
DROP TABLE IF EXISTS public.entrances CASCADE;
DROP TABLE IF EXISTS public.building_blocks CASCADE;

-- 15. Créer une organization par défaut pour la migration
INSERT INTO public.organizations (name, description) 
VALUES ('Organisation par défaut', 'Organisation créée lors de la migration');

-- 16. Mettre à jour les tables de liaison pour les nouvelles policies
DROP POLICY IF EXISTS "Users can view group elements for their buildings" ON public.location_group_elements;
DROP POLICY IF EXISTS "Users can manage group elements for their buildings" ON public.location_group_elements;

CREATE POLICY "Users can view group elements for their organizations"
ON public.location_group_elements
FOR SELECT
TO authenticated
USING (group_id IN (
  SELECT lg.id
  FROM location_groups lg
  WHERE lg.organization_id IN (
    SELECT m.organization_id
    FROM memberships m
    WHERE m.user_id = auth.uid() AND m.is_active = true
  )
));

CREATE POLICY "Users can manage group elements for their organizations"
ON public.location_group_elements
FOR ALL
TO authenticated
USING (group_id IN (
  SELECT lg.id
  FROM location_groups lg
  WHERE fn_has_org_perm(auth.uid(), lg.organization_id, 'location.manage')
));

-- Répéter pour les autres tables de liaison...
DROP POLICY IF EXISTS "Users can view group tags for their buildings" ON public.location_group_tags;
DROP POLICY IF EXISTS "Users can manage group tags for their buildings" ON public.location_group_tags;

CREATE POLICY "Users can view group tags for their organizations"
ON public.location_group_tags
FOR SELECT
TO authenticated
USING (group_id IN (
  SELECT lg.id
  FROM location_groups lg
  WHERE lg.organization_id IN (
    SELECT m.organization_id
    FROM memberships m
    WHERE m.user_id = auth.uid() AND m.is_active = true
  )
));

CREATE POLICY "Users can manage group tags for their organizations"
ON public.location_group_tags
FOR ALL
TO authenticated
USING (group_id IN (
  SELECT lg.id
  FROM location_groups lg
  WHERE fn_has_org_perm(auth.uid(), lg.organization_id, 'location.manage')
));

-- Et pour les ensembles...
DROP POLICY IF EXISTS "Users can view ensemble groups for their buildings" ON public.location_ensemble_groups;
DROP POLICY IF EXISTS "Users can manage ensemble groups for their buildings" ON public.location_ensemble_groups;

CREATE POLICY "Users can view ensemble groups for their organizations"
ON public.location_ensemble_groups
FOR SELECT
TO authenticated
USING (ensemble_id IN (
  SELECT le.id
  FROM location_ensembles le
  WHERE le.organization_id IN (
    SELECT m.organization_id
    FROM memberships m
    WHERE m.user_id = auth.uid() AND m.is_active = true
  )
));

CREATE POLICY "Users can manage ensemble groups for their organizations"
ON public.location_ensemble_groups
FOR ALL
TO authenticated
USING (ensemble_id IN (
  SELECT le.id
  FROM location_ensembles le
  WHERE fn_has_org_perm(auth.uid(), le.organization_id, 'location.manage')
));

DROP POLICY IF EXISTS "Users can view ensemble tags for their buildings" ON public.location_ensemble_tags;
DROP POLICY IF EXISTS "Users can manage ensemble tags for their buildings" ON public.location_ensemble_tags;

CREATE POLICY "Users can view ensemble tags for their organizations"
ON public.location_ensemble_tags
FOR SELECT
TO authenticated
USING (ensemble_id IN (
  SELECT le.id
  FROM location_ensembles le
  WHERE le.organization_id IN (
    SELECT m.organization_id
    FROM memberships m
    WHERE m.user_id = auth.uid() AND m.is_active = true
  )
));

CREATE POLICY "Users can manage ensemble tags for their organizations"
ON public.location_ensemble_tags
FOR ALL
TO authenticated
USING (ensemble_id IN (
  SELECT le.id
  FROM location_ensembles le
  WHERE fn_has_org_perm(auth.uid(), le.organization_id, 'location.manage')
));

-- Enfin supprimer la table buildings et toutes ses dépendances
-- ATTENTION: Cette étape supprimera toutes les données existantes
DROP TABLE IF EXISTS public.buildings CASCADE;
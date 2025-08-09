-- REFONTE COMPLÈTE: Étape 1 - Supprimer toutes les policies RLS existantes
-- Puis créer la nouvelle architecture Organizations

-- 1. Supprimer toutes les policies RLS des tables location_*
DROP POLICY IF EXISTS "Users can view elements for their buildings" ON public.location_elements;
DROP POLICY IF EXISTS "Users can manage elements for their buildings" ON public.location_elements;
DROP POLICY IF EXISTS "Users can view element tags for their buildings" ON public.location_element_tags;
DROP POLICY IF EXISTS "Users can manage element tags for their buildings" ON public.location_element_tags;

DROP POLICY IF EXISTS "Users can view groups for their buildings" ON public.location_groups;
DROP POLICY IF EXISTS "Users can manage groups for their buildings" ON public.location_groups;
DROP POLICY IF EXISTS "Users can view group elements for their buildings" ON public.location_group_elements;
DROP POLICY IF EXISTS "Users can manage group elements for their buildings" ON public.location_group_elements;
DROP POLICY IF EXISTS "Users can view group tags for their buildings" ON public.location_group_tags;
DROP POLICY IF EXISTS "Users can manage group tags for their buildings" ON public.location_group_tags;

DROP POLICY IF EXISTS "Users can view ensembles for their buildings" ON public.location_ensembles;
DROP POLICY IF EXISTS "Users can manage ensembles for their buildings" ON public.location_ensembles;
DROP POLICY IF EXISTS "Users can view ensemble groups for their buildings" ON public.location_ensemble_groups;
DROP POLICY IF EXISTS "Users can manage ensemble groups for their buildings" ON public.location_ensemble_groups;
DROP POLICY IF EXISTS "Users can view ensemble tags for their buildings" ON public.location_ensemble_tags;
DROP POLICY IF EXISTS "Users can manage ensemble tags for their buildings" ON public.location_ensemble_tags;

DROP POLICY IF EXISTS "Users can view tags for their buildings" ON public.location_tags;
DROP POLICY IF EXISTS "Users can manage tags for their buildings" ON public.location_tags;

-- 2. Créer la table organizations
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3. Créer une organization par défaut
INSERT INTO public.organizations (name, description) 
VALUES ('Organisation par défaut', 'Organisation créée lors de la migration');

-- 4. Modifier les tables une par une avec CASCADE
ALTER TABLE public.location_elements DROP COLUMN building_id CASCADE;
ALTER TABLE public.location_elements ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.location_groups DROP COLUMN building_id CASCADE;
ALTER TABLE public.location_groups ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.location_ensembles DROP COLUMN building_id CASCADE;
ALTER TABLE public.location_ensembles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.location_tags DROP COLUMN building_id CASCADE;
ALTER TABLE public.location_tags ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 5. Modifier memberships
ALTER TABLE public.memberships DROP COLUMN building_id CASCADE;
ALTER TABLE public.memberships DROP COLUMN block_id CASCADE;
ALTER TABLE public.memberships DROP COLUMN entrance_id CASCADE;
ALTER TABLE public.memberships DROP COLUMN floor_id CASCADE;
ALTER TABLE public.memberships DROP COLUMN unit_id CASCADE;
ALTER TABLE public.memberships ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 6. Créer la nouvelle fonction de permissions
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

-- 7. Trigger pour organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Supprimer les tables physiques obsolètes
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.floors CASCADE;
DROP TABLE IF EXISTS public.entrances CASCADE;
DROP TABLE IF EXISTS public.building_blocks CASCADE;
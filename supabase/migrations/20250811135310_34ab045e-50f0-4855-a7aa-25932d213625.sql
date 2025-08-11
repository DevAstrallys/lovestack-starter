-- Créer une table pour les memberships aux lieux (éléments, groupements, ensembles)
CREATE TABLE public.location_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES public.roles(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  
  -- Un seul de ces champs doit être rempli selon la hiérarchie
  element_id uuid REFERENCES public.location_elements(id),
  group_id uuid REFERENCES public.location_groups(id),
  ensemble_id uuid REFERENCES public.location_ensembles(id),
  
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Contrainte pour s'assurer qu'un seul type de lieu est défini
  CONSTRAINT single_location_type CHECK (
    (element_id IS NOT NULL AND group_id IS NULL AND ensemble_id IS NULL) OR
    (element_id IS NULL AND group_id IS NOT NULL AND ensemble_id IS NULL) OR
    (element_id IS NULL AND group_id IS NULL AND ensemble_id IS NOT NULL)
  )
);

-- Index pour les performances
CREATE INDEX idx_location_memberships_user_id ON public.location_memberships(user_id);
CREATE INDEX idx_location_memberships_element_id ON public.location_memberships(element_id);
CREATE INDEX idx_location_memberships_group_id ON public.location_memberships(group_id);
CREATE INDEX idx_location_memberships_ensemble_id ON public.location_memberships(ensemble_id);
CREATE INDEX idx_location_memberships_organization_id ON public.location_memberships(organization_id);

-- Politique RLS pour la table location_memberships
ALTER TABLE public.location_memberships ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres memberships
CREATE POLICY "Users can view their own location memberships" 
ON public.location_memberships 
FOR SELECT 
USING (user_id = auth.uid());

-- Les managers d'organisation peuvent voir tous les memberships de leur organisation
CREATE POLICY "Organization managers can view all location memberships" 
ON public.location_memberships 
FOR SELECT 
USING (fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'));

-- Les managers d'organisation peuvent créer des memberships
CREATE POLICY "Organization managers can create location memberships" 
ON public.location_memberships 
FOR INSERT 
WITH CHECK (fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'));

-- Les managers d'organisation peuvent modifier des memberships
CREATE POLICY "Organization managers can update location memberships" 
ON public.location_memberships 
FOR UPDATE 
USING (fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'));

-- Les managers d'organisation peuvent supprimer des memberships
CREATE POLICY "Organization managers can delete location memberships" 
ON public.location_memberships 
FOR DELETE 
USING (fn_has_org_perm(auth.uid(), organization_id, 'locations.manage'));

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_location_memberships_updated_at
BEFORE UPDATE ON public.location_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Créer une fonction pour résoudre le rôle principal d'un utilisateur
CREATE OR REPLACE FUNCTION public.fn_get_user_primary_role(
  uid uuid, 
  org_id uuid
)
RETURNS TABLE (
  role_code text,
  role_name text,
  location_type text,
  location_name text,
  location_id uuid
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ordre de priorité : ensemble > group > element
  -- Ordre de rôle : admin > manager > user > viewer
  
  RETURN QUERY
  WITH ranked_memberships AS (
    SELECT 
      r.code as role_code,
      COALESCE(r.label->>'fr', r.code) as role_name,
      CASE 
        WHEN lm.ensemble_id IS NOT NULL THEN 'ensemble'
        WHEN lm.group_id IS NOT NULL THEN 'group'
        WHEN lm.element_id IS NOT NULL THEN 'element'
      END as location_type,
      COALESCE(
        le.name,
        lg.name, 
        lel.name
      ) as location_name,
      COALESCE(
        lm.ensemble_id,
        lm.group_id,
        lm.element_id
      ) as location_id,
      -- Score de priorité : type de lieu + type de rôle
      CASE 
        WHEN lm.ensemble_id IS NOT NULL THEN 300
        WHEN lm.group_id IS NOT NULL THEN 200
        WHEN lm.element_id IS NOT NULL THEN 100
        ELSE 0
      END +
      CASE r.code
        WHEN 'admin' THEN 30
        WHEN 'manager' THEN 20
        WHEN 'user' THEN 10
        WHEN 'viewer' THEN 5
        ELSE 1
      END as priority_score
    FROM location_memberships lm
    JOIN roles r ON r.id = lm.role_id
    LEFT JOIN location_ensembles le ON le.id = lm.ensemble_id
    LEFT JOIN location_groups lg ON lg.id = lm.group_id
    LEFT JOIN location_elements lel ON lel.id = lm.element_id
    WHERE lm.user_id = uid 
      AND lm.organization_id = org_id
      AND lm.is_active = true
    ORDER BY priority_score DESC
    LIMIT 1
  )
  SELECT 
    rm.role_code,
    rm.role_name,
    rm.location_type,
    rm.location_name,
    rm.location_id
  FROM ranked_memberships rm;
END;
$$;
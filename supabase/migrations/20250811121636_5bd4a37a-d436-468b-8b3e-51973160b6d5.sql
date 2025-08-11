-- Ajouter une relation entre les QR codes et les éléments de location
-- et permettre aux QR codes d'être attachés aux éléments plutôt qu'aux buildings

-- Ajouter une colonne pour lier les QR codes aux éléments de location
ALTER TABLE public.qr_codes ADD COLUMN location_element_id UUID;

-- Ajouter une contrainte de foreign key
ALTER TABLE public.qr_codes ADD CONSTRAINT fk_qr_codes_location_element 
FOREIGN KEY (location_element_id) REFERENCES public.location_elements(id) ON DELETE CASCADE;

-- Rendre building_id nullable car maintenant on peut avoir des QR codes liés aux éléments
ALTER TABLE public.qr_codes ALTER COLUMN building_id DROP NOT NULL;

-- Ajouter une contrainte pour s'assurer qu'au moins un des deux (building_id ou location_element_id) est défini
ALTER TABLE public.qr_codes ADD CONSTRAINT check_qr_code_parent 
CHECK (
  (building_id IS NOT NULL AND location_element_id IS NULL) OR 
  (building_id IS NULL AND location_element_id IS NOT NULL)
);

-- Mettre à jour les politiques RLS pour inclure les QR codes liés aux éléments
DROP POLICY IF EXISTS "Building managers can manage QR codes" ON public.qr_codes;

CREATE POLICY "Users can manage QR codes for their buildings" 
ON public.qr_codes 
FOR ALL
USING (
  (building_id IS NOT NULL AND fn_has_perm(auth.uid(), building_id, 'qr_codes.manage'::text)) OR
  (location_element_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.location_elements le 
    WHERE le.id = qr_codes.location_element_id 
    AND fn_has_org_perm(auth.uid(), le.organization_id, 'locations.manage'::text)
  ))
);
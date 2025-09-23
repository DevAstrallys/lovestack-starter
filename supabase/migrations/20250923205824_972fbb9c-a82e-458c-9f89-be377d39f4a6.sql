-- Vérifier si la table qr_codes existe et créer les politiques RLS
DO $$
BEGIN
    -- Créer la table qr_codes si elle n'existe pas
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'qr_codes') THEN
        CREATE TABLE public.qr_codes (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
            location_element_id UUID REFERENCES public.location_elements(id) ON DELETE CASCADE,
            location_group_id UUID REFERENCES public.location_groups(id) ON DELETE CASCADE,
            location_ensemble_id UUID REFERENCES public.location_ensembles(id) ON DELETE CASCADE,
            display_label TEXT,
            target_slug TEXT UNIQUE,
            version INTEGER NOT NULL DEFAULT 1,
            is_active BOOLEAN NOT NULL DEFAULT true,
            last_regenerated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            -- Configuration du formulaire associé
            form_config JSONB DEFAULT '{}'::jsonb,
            -- Organisation pour RLS
            organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
            created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
        );

        -- Contrainte pour s'assurer qu'un QR code est associé à exactement un type de lieu
        ALTER TABLE public.qr_codes ADD CONSTRAINT qr_codes_single_location_check 
        CHECK (
            (building_id IS NOT NULL AND location_element_id IS NULL AND location_group_id IS NULL AND location_ensemble_id IS NULL) OR
            (building_id IS NULL AND location_element_id IS NOT NULL AND location_group_id IS NULL AND location_ensemble_id IS NULL) OR
            (building_id IS NULL AND location_element_id IS NULL AND location_group_id IS NOT NULL AND location_ensemble_id IS NULL) OR
            (building_id IS NULL AND location_element_id IS NULL AND location_group_id IS NULL AND location_ensemble_id IS NOT NULL)
        );

        -- Index pour les performances
        CREATE INDEX idx_qr_codes_organization_id ON public.qr_codes(organization_id);
        CREATE INDEX idx_qr_codes_target_slug ON public.qr_codes(target_slug);
        CREATE INDEX idx_qr_codes_is_active ON public.qr_codes(is_active);
        CREATE INDEX idx_qr_codes_location_element_id ON public.qr_codes(location_element_id);
        CREATE INDEX idx_qr_codes_location_group_id ON public.qr_codes(location_group_id);
        CREATE INDEX idx_qr_codes_location_ensemble_id ON public.qr_codes(location_ensemble_id);
    END IF;

    -- Ajouter les colonnes manquantes si elles n'existent pas
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'organization_id') THEN
        ALTER TABLE public.qr_codes ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
        CREATE INDEX idx_qr_codes_organization_id ON public.qr_codes(organization_id);
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'location_group_id') THEN
        ALTER TABLE public.qr_codes ADD COLUMN location_group_id UUID REFERENCES public.location_groups(id) ON DELETE CASCADE;
        CREATE INDEX idx_qr_codes_location_group_id ON public.qr_codes(location_group_id);
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'location_ensemble_id') THEN
        ALTER TABLE public.qr_codes ADD COLUMN location_ensemble_id UUID REFERENCES public.location_ensembles(id) ON DELETE CASCADE;
        CREATE INDEX idx_qr_codes_location_ensemble_id ON public.qr_codes(location_ensemble_id);
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'form_config') THEN
        ALTER TABLE public.qr_codes ADD COLUMN form_config JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'created_by') THEN
        ALTER TABLE public.qr_codes ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Activer RLS sur la table qr_codes
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view QR codes in their organizations" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can create QR codes in their organizations" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can update QR codes in their organizations" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can delete QR codes in their organizations" ON public.qr_codes;
DROP POLICY IF EXISTS "Public can view active QR codes" ON public.qr_codes;

-- Créer les politiques RLS pour les QR codes
CREATE POLICY "Users can view QR codes in their organizations" 
ON public.qr_codes 
FOR SELECT 
USING (
    organization_id IN (
        SELECT m.organization_id 
        FROM public.memberships m 
        WHERE m.user_id = auth.uid() 
        AND m.is_active = true
    )
);

CREATE POLICY "Users can create QR codes in their organizations" 
ON public.qr_codes 
FOR INSERT 
WITH CHECK (
    organization_id IN (
        SELECT m.organization_id 
        FROM public.memberships m 
        WHERE m.user_id = auth.uid() 
        AND m.is_active = true
    )
);

CREATE POLICY "Users can update QR codes in their organizations" 
ON public.qr_codes 
FOR UPDATE 
USING (
    organization_id IN (
        SELECT m.organization_id 
        FROM public.memberships m 
        WHERE m.user_id = auth.uid() 
        AND m.is_active = true
    )
);

CREATE POLICY "Users can delete QR codes in their organizations" 
ON public.qr_codes 
FOR DELETE 
USING (
    organization_id IN (
        SELECT m.organization_id 
        FROM public.memberships m 
        WHERE m.user_id = auth.uid() 
        AND m.is_active = true
    )
);

-- Politique publique pour permettre l'accès aux QR codes actifs par leur slug (pour les formulaires)
CREATE POLICY "Public can view active QR codes by slug" 
ON public.qr_codes 
FOR SELECT 
USING (is_active = true AND target_slug IS NOT NULL);

-- Créer la fonction pour régénérer un QR code
CREATE OR REPLACE FUNCTION public.regenerate_qr_code(qr_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_version INTEGER;
    result_id UUID;
BEGIN
    -- Vérifier que l'utilisateur a accès à ce QR code
    IF NOT EXISTS (
        SELECT 1 FROM public.qr_codes qr
        WHERE qr.id = qr_id
        AND qr.organization_id IN (
            SELECT m.organization_id 
            FROM public.memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.is_active = true
        )
    ) THEN
        RAISE EXCEPTION 'Accès refusé au QR code';
    END IF;

    -- Obtenir la nouvelle version
    SELECT version + 1 INTO new_version 
    FROM public.qr_codes 
    WHERE id = qr_id;

    -- Mettre à jour le QR code
    UPDATE public.qr_codes 
    SET 
        version = new_version,
        last_regenerated_at = now(),
        updated_at = now()
    WHERE id = qr_id
    RETURNING id INTO result_id;

    RETURN result_id;
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Créer le trigger si il n'existe pas
DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON public.qr_codes;
CREATE TRIGGER update_qr_codes_updated_at
    BEFORE UPDATE ON public.qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
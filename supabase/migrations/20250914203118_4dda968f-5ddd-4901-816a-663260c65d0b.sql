-- Ajouter les champs manquants aux tickets
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr',
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.tax_categories(id),
ADD COLUMN IF NOT EXISTS object_id UUID REFERENCES public.tax_objects(id);

-- Ajouter un index sur last_interaction_at pour les performances
CREATE INDEX IF NOT EXISTS idx_tickets_last_interaction_at ON public.tickets(last_interaction_at DESC);

-- Trigger pour mettre à jour last_interaction_at lors des modifications de ticket
CREATE OR REPLACE FUNCTION public.update_ticket_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_interaction_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_ticket_last_interaction
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ticket_last_interaction();

-- Ajouter les champs manquants aux QR codes
ALTER TABLE public.qr_codes 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_regenerated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Contrainte pour un seul QR actif par lieu
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_codes_unique_active_per_location 
ON public.qr_codes(location_element_id) 
WHERE is_active = true AND location_element_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_codes_unique_active_per_building 
ON public.qr_codes(building_id) 
WHERE is_active = true AND building_id IS NOT NULL AND location_element_id IS NULL;

-- Fonction pour régénérer un QR code
CREATE OR REPLACE FUNCTION public.regenerate_qr_code(qr_id UUID)
RETURNS UUID AS $$
DECLARE
  old_qr RECORD;
  new_qr_id UUID;
BEGIN
  -- Récupérer l'ancien QR code
  SELECT * INTO old_qr FROM public.qr_codes WHERE id = qr_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QR code not found';
  END IF;
  
  -- Désactiver l'ancien QR code
  UPDATE public.qr_codes 
  SET is_active = false 
  WHERE id = qr_id;
  
  -- Créer le nouveau QR code
  INSERT INTO public.qr_codes (
    building_id, 
    location_element_id, 
    location, 
    display_label, 
    target_slug,
    version,
    is_active,
    last_regenerated_at
  ) VALUES (
    old_qr.building_id,
    old_qr.location_element_id,
    old_qr.location,
    old_qr.display_label,
    old_qr.target_slug,
    old_qr.version + 1,
    true,
    now()
  ) RETURNING id INTO new_qr_id;
  
  RETURN new_qr_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter des champs i18n aux catégories et objets
ALTER TABLE public.tax_categories 
ADD COLUMN IF NOT EXISTS label_i18n JSONB DEFAULT '{"fr": ""}'::jsonb;

ALTER TABLE public.tax_objects 
ADD COLUMN IF NOT EXISTS label_i18n JSONB DEFAULT '{"fr": ""}'::jsonb;

-- Migrer les données existantes vers i18n
UPDATE public.tax_categories 
SET label_i18n = jsonb_build_object('fr', label)
WHERE label_i18n = '{"fr": ""}'::jsonb;

UPDATE public.tax_objects 
SET label_i18n = jsonb_build_object('fr', label)
WHERE label_i18n = '{"fr": ""}'::jsonb;

-- Ajouter parent_id pour la hiérarchie des lieux si pas déjà présent
ALTER TABLE public.location_elements 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.location_groups(id);

ALTER TABLE public.location_groups 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.location_ensembles(id);

-- Table des activités de tickets (plus spécialisée que ticket_events)
CREATE TABLE IF NOT EXISTS public.ticket_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('message', 'status_change', 'assignment', 'priority_change', 'attachment', 'duplicate_link')),
  content TEXT,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_internal BOOLEAN DEFAULT false
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_ticket_activities_ticket_id ON public.ticket_activities(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_activities_actor_id ON public.ticket_activities(actor_id);

-- RLS pour ticket_activities
ALTER TABLE public.ticket_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities for accessible tickets" 
ON public.ticket_activities 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tickets t 
    WHERE t.id = ticket_activities.ticket_id 
    AND (
      t.created_by = auth.uid() 
      OR t.assigned_to = auth.uid() 
      OR fn_has_perm(auth.uid(), t.building_id, 'ticket.read'::text)
    )
  )
);

CREATE POLICY "Authorized users can create ticket activities" 
ON public.ticket_activities 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tickets t 
    WHERE t.id = ticket_activities.ticket_id 
    AND (
      t.created_by = auth.uid() 
      OR t.assigned_to = auth.uid() 
      OR fn_has_perm(auth.uid(), t.building_id, 'ticket.write'::text)
    )
  )
);

-- Trigger pour créer une activité lors des changements de ticket
CREATE OR REPLACE FUNCTION public.log_ticket_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.ticket_activities (
      ticket_id, actor_id, activity_type, old_value, new_value
    ) VALUES (
      NEW.id, auth.uid(), 'status_change', OLD.status::text, NEW.status::text
    );
  END IF;
  
  -- Log assignment changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.ticket_activities (
      ticket_id, actor_id, activity_type, old_value, new_value
    ) VALUES (
      NEW.id, auth.uid(), 'assignment', OLD.assigned_to::text, NEW.assigned_to::text
    );
  END IF;
  
  -- Log priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.ticket_activities (
      ticket_id, actor_id, activity_type, old_value, new_value
    ) VALUES (
      NEW.id, auth.uid(), 'priority_change', OLD.priority::text, NEW.priority::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_ticket_changes
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ticket_changes();
-- Corriger les fonctions avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.update_ticket_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_interaction_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
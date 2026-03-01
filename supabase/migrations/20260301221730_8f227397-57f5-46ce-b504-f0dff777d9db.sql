
-- Add expires_at to location_memberships too
ALTER TABLE public.location_memberships ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT NULL;

-- Create function to auto-deactivate expired location_memberships
CREATE OR REPLACE FUNCTION public.fn_deactivate_expired_memberships()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired_row RECORD;
BEGIN
  -- Expire memberships
  FOR expired_row IN 
    SELECT id, user_id, role_id, organization_id
    FROM public.memberships 
    WHERE expires_at IS NOT NULL AND expires_at <= now() AND is_active = true
  LOOP
    UPDATE public.memberships SET is_active = false WHERE id = expired_row.id;
    INSERT INTO public.audit_logs (entity, entity_id, action, actor_id, data)
    VALUES ('membership', expired_row.id, 'auto_expired', NULL,
      jsonb_build_object('user_id', expired_row.user_id, 'role_id', expired_row.role_id, 'organization_id', expired_row.organization_id, 'expired_at', now()));
  END LOOP;

  -- Expire location_memberships
  FOR expired_row IN 
    SELECT id, user_id, role_id, organization_id
    FROM public.location_memberships 
    WHERE expires_at IS NOT NULL AND expires_at <= now() AND is_active = true
  LOOP
    UPDATE public.location_memberships SET is_active = false WHERE id = expired_row.id;
    INSERT INTO public.audit_logs (entity, entity_id, action, actor_id, data)
    VALUES ('location_membership', expired_row.id, 'auto_expired', NULL,
      jsonb_build_object('user_id', expired_row.user_id, 'role_id', expired_row.role_id, 'organization_id', expired_row.organization_id, 'expired_at', now()));
  END LOOP;
END;
$$;

-- Audit trigger for location_memberships too
CREATE OR REPLACE FUNCTION public.fn_audit_location_membership_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (entity, entity_id, action, actor_id, data)
    VALUES ('location_membership', NEW.id, 'membership_created', auth.uid(), 
      jsonb_build_object('user_id', NEW.user_id, 'role_id', NEW.role_id, 'organization_id', NEW.organization_id, 'expires_at', NEW.expires_at));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role_id IS DISTINCT FROM NEW.role_id 
       OR OLD.is_active IS DISTINCT FROM NEW.is_active
       OR OLD.expires_at IS DISTINCT FROM NEW.expires_at THEN
      INSERT INTO public.audit_logs (entity, entity_id, action, actor_id, data)
      VALUES ('location_membership', NEW.id, 'membership_updated', auth.uid(),
        jsonb_build_object('user_id', NEW.user_id, 'old_role_id', OLD.role_id, 'new_role_id', NEW.role_id,
          'old_is_active', OLD.is_active, 'new_is_active', NEW.is_active,
          'old_expires_at', OLD.expires_at, 'new_expires_at', NEW.expires_at));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (entity, entity_id, action, actor_id, data)
    VALUES ('location_membership', OLD.id, 'membership_deleted', auth.uid(),
      jsonb_build_object('user_id', OLD.user_id, 'role_id', OLD.role_id, 'organization_id', OLD.organization_id));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_location_memberships
AFTER INSERT OR UPDATE OR DELETE ON public.location_memberships
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_location_membership_changes();


-- 1. Create missing roles
INSERT INTO public.roles (code, label, description, is_platform_scope, is_active, parent_id, sort_order)
VALUES 
  ('data_client', '{"fr":"Client Data","en":"Data Client"}'::jsonb, 'Accès exclusif aux statistiques anonymisées', false, true, 
    (SELECT id FROM public.roles WHERE code = 'externe'), 45),
  ('administration_publique', '{"fr":"Administration Publique","en":"Public Administration"}'::jsonb, 'Accès aux registres de sécurité et conformité', false, true, 
    (SELECT id FROM public.roles WHERE code = 'services_publics'), 53),
  ('concierge_digital', '{"fr":"Concierge Digital","en":"Digital Concierge"}'::jsonb, 'Rôle système pour IA et automatisations', true, true, NULL, 55);

-- 2. Add expires_at column to memberships
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT NULL;

-- 3. Create function to auto-deactivate expired memberships
CREATE OR REPLACE FUNCTION public.fn_deactivate_expired_memberships()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired_row RECORD;
BEGIN
  FOR expired_row IN 
    SELECT id, user_id, role_id, organization_id
    FROM public.memberships 
    WHERE expires_at IS NOT NULL 
      AND expires_at <= now() 
      AND is_active = true
  LOOP
    UPDATE public.memberships SET is_active = false WHERE id = expired_row.id;
    
    INSERT INTO public.audit_logs (entity, entity_id, action, actor_id, data)
    VALUES (
      'membership', 
      expired_row.id, 
      'auto_expired',
      NULL,
      jsonb_build_object(
        'user_id', expired_row.user_id,
        'role_id', expired_row.role_id,
        'organization_id', expired_row.organization_id,
        'expired_at', now()
      )
    );
  END LOOP;
END;
$$;

-- 4. Audit trail trigger on memberships
CREATE OR REPLACE FUNCTION public.fn_audit_membership_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (entity, entity_id, action, actor_id, data)
    VALUES ('membership', NEW.id, 'membership_created', auth.uid(), 
      jsonb_build_object('user_id', NEW.user_id, 'role_id', NEW.role_id, 'organization_id', NEW.organization_id, 'expires_at', NEW.expires_at));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role_id IS DISTINCT FROM NEW.role_id 
       OR OLD.is_active IS DISTINCT FROM NEW.is_active
       OR OLD.expires_at IS DISTINCT FROM NEW.expires_at THEN
      INSERT INTO public.audit_logs (entity, entity_id, action, actor_id, data)
      VALUES ('membership', NEW.id, 'membership_updated', auth.uid(),
        jsonb_build_object(
          'user_id', NEW.user_id,
          'old_role_id', OLD.role_id, 'new_role_id', NEW.role_id,
          'old_is_active', OLD.is_active, 'new_is_active', NEW.is_active,
          'old_expires_at', OLD.expires_at, 'new_expires_at', NEW.expires_at
        ));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (entity, entity_id, action, actor_id, data)
    VALUES ('membership', OLD.id, 'membership_deleted', auth.uid(),
      jsonb_build_object('user_id', OLD.user_id, 'role_id', OLD.role_id, 'organization_id', OLD.organization_id));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_memberships
AFTER INSERT OR UPDATE OR DELETE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_membership_changes();

-- 5. Map permissions to business roles

-- syndic: full org access
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'syndic' AND p.code IN (
  'admin.all','organization.manage','organization.read','organization.write',
  'locations.manage','locations.read','locations.write','locations.access',
  'tickets.create','tickets.read','tickets.write','tickets.assign','tickets.resolve',
  'ticket.read','ticket.write','ticket.assign',
  'documents.manage','documents.read','documents.write','document.read','document.write',
  'buildings.manage','buildings.read','buildings.write','building.read','building.write',
  'contracts.create','contracts.read','contracts.update','contracts.write','contract.read','contract.write',
  'equipment.manage','equipment.read','equipment.write',
  'qr_codes.manage','qr_codes.read','qr_codes.write',
  'users.invite','users.manage','users.read','user.read','user.write',
  'reports.read','reports.write','report.read','report.write',
  'notifications.read','notifications.send',
  'finances.read','finances.write','budgets.read','budgets.write','budgets.review',
  'surveys.manage','surveys.read','surveys.write','survey.read','survey.write',
  'modules.manage','modules.read','modules.write',
  'audit.read','audit.write',
  'entity.read','entity.write','entity.comment','entity.validate','entity.delete'
)
ON CONFLICT DO NOTHING;

-- conseil_syndical: read-only on everything
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'conseil_syndical' AND p.code IN (
  'organization.read','locations.read','locations.access',
  'tickets.read','ticket.read',
  'documents.read','document.read',
  'buildings.read','building.read',
  'contracts.read','contract.read',
  'equipment.read',
  'qr_codes.read',
  'users.read','user.read',
  'reports.read','report.read',
  'notifications.read',
  'finances.read','budgets.read',
  'surveys.read','survey.read',
  'modules.read',
  'audit.read',
  'entity.read','entity.comment'
)
ON CONFLICT DO NOTHING;

-- proprietaire: own docs + public docs + tickets
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'proprietaire' AND p.code IN (
  'organization.read','locations.read','locations.access',
  'tickets.create','tickets.read','ticket.read','ticket.write',
  'documents.read','document.read',
  'buildings.read','building.read',
  'contracts.read','contract.read',
  'notifications.read',
  'finances.read','budgets.read',
  'entity.read','entity.comment',
  'surveys.read','survey.read','survey.write'
)
ON CONFLICT DO NOTHING;

-- locataire: limited - create tickets, view notices
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'locataire' AND p.code IN (
  'organization.read','locations.read','locations.access',
  'tickets.create','tickets.read','ticket.read','ticket.write',
  'documents.read','document.read',
  'buildings.read','building.read',
  'notifications.read',
  'entity.read','entity.comment',
  'surveys.read','survey.read','survey.write'
)
ON CONFLICT DO NOTHING;

-- prestataire: assigned tickets only + status update
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'prestataire' AND p.code IN (
  'tickets.read','ticket.read','ticket.write','tickets.resolve',
  'locations.read','locations.access',
  'buildings.read','building.read',
  'documents.read','document.read',
  'equipment.read',
  'entity.read','entity.comment',
  'notifications.read'
)
ON CONFLICT DO NOTHING;

-- expert + auditeur: read-only deep access
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code IN ('expert', 'auditeur') AND p.code IN (
  'organization.read','locations.read','locations.access',
  'tickets.read','ticket.read',
  'documents.read','document.read',
  'buildings.read','building.read',
  'contracts.read','contract.read',
  'equipment.read',
  'reports.read','report.read',
  'audit.read',
  'entity.read',
  'notifications.read'
)
ON CONFLICT DO NOTHING;

-- pompier + police: emergency docs only
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code IN ('pompier', 'police') AND p.code IN (
  'emergency.access','emergency.override',
  'buildings.read','building.read',
  'documents.read','document.read',
  'locations.read','locations.access'
)
ON CONFLICT DO NOTHING;

-- data_client: stats only
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'data_client' AND p.code IN (
  'reports.read','report.read',
  'organization.read'
)
ON CONFLICT DO NOTHING;

-- administration_publique: security registers
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'administration_publique' AND p.code IN (
  'documents.read','document.read',
  'buildings.read','building.read',
  'audit.read',
  'organization.read'
)
ON CONFLICT DO NOTHING;

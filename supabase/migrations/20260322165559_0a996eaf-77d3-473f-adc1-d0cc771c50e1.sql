-- SECURITY FIX: Correct sort_order hierarchy for all 43 roles
-- Lower sort_order = higher privilege

-- PLATFORM (1-6)
UPDATE public.roles SET sort_order = 1 WHERE code = 'admin_platform';
UPDATE public.roles SET sort_order = 2 WHERE code = 'super_admin';
UPDATE public.roles SET sort_order = 3 WHERE code = 'admin';
UPDATE public.roles SET sort_order = 4 WHERE code = 'gestionnaire_logiciel';
UPDATE public.roles SET sort_order = 5 WHERE code = 'tech_logiciel';
UPDATE public.roles SET sort_order = 6 WHERE code = 'concierge_digital';

-- ORGANISATION (10-19)
UPDATE public.roles SET sort_order = 10 WHERE code = 'admin_org';
UPDATE public.roles SET sort_order = 11 WHERE code = 'manager';
UPDATE public.roles SET sort_order = 12 WHERE code = 'gestionnaire';
UPDATE public.roles SET sort_order = 13 WHERE code = 'syndic';
UPDATE public.roles SET sort_order = 14 WHERE code = 'conseil_syndical';
UPDATE public.roles SET sort_order = 15 WHERE code = 'gestionnaire_biens';
UPDATE public.roles SET sort_order = 16 WHERE code = 'comptable';
UPDATE public.roles SET sort_order = 17 WHERE code = 'assistant';
UPDATE public.roles SET sort_order = 18 WHERE code = 'juridique';
UPDATE public.roles SET sort_order = 19 WHERE code = 'gestion_locative';

-- TERRAIN (20-29)
UPDATE public.roles SET sort_order = 20 WHERE code = 'proprietaire';
UPDATE public.roles SET sort_order = 21 WHERE code = 'proprietaire_bailleur';
UPDATE public.roles SET sort_order = 22 WHERE code = 'locataire';
UPDATE public.roles SET sort_order = 23 WHERE code = 'gardien';
UPDATE public.roles SET sort_order = 24 WHERE code = 'externe';
UPDATE public.roles SET sort_order = 25 WHERE code = 'prestataire';
UPDATE public.roles SET sort_order = 26 WHERE code = 'technicien_prestataire';
UPDATE public.roles SET sort_order = 27 WHERE code = 'technicien';
UPDATE public.roles SET sort_order = 28 WHERE code = 'maintenance';
UPDATE public.roles SET sort_order = 29 WHERE code = 'urgence';

-- SPÉCIALISÉS (30-43)
UPDATE public.roles SET sort_order = 30 WHERE code = 'user';
UPDATE public.roles SET sort_order = 31 WHERE code = 'visiteur';
UPDATE public.roles SET sort_order = 32 WHERE code = 'consultant';
UPDATE public.roles SET sort_order = 33 WHERE code = 'expert';
UPDATE public.roles SET sort_order = 34 WHERE code = 'auditeur';
UPDATE public.roles SET sort_order = 35 WHERE code = 'assurance';
UPDATE public.roles SET sort_order = 36 WHERE code = 'notaire';
UPDATE public.roles SET sort_order = 37 WHERE code = 'invite';
UPDATE public.roles SET sort_order = 38 WHERE code = 'partenaire';
UPDATE public.roles SET sort_order = 39 WHERE code = 'data_client';
UPDATE public.roles SET sort_order = 40 WHERE code = 'services_publics';
UPDATE public.roles SET sort_order = 41 WHERE code = 'pompier';
UPDATE public.roles SET sort_order = 42 WHERE code = 'police';
UPDATE public.roles SET sort_order = 43 WHERE code = 'administration_publique';

-- STEP B: Replace INSERT policy with role hierarchy check
DROP POLICY IF EXISTS "memberships_insert_authorized" ON public.memberships;

CREATE POLICY "memberships_insert_authorized"
ON public.memberships FOR INSERT
TO authenticated
WITH CHECK (
  -- Caller must have a management role
  EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = (SELECT auth.uid())
    AND r.code IN (
      'admin_platform','super_admin','admin',
      'admin_org','manager','gestionnaire','syndic'
    )
    AND m.is_active = true
  )
  -- Inserted role must be equal or lower privilege than caller's best role
  AND (
    (SELECT r2.sort_order FROM public.roles r2 WHERE r2.id = role_id)
    >=
    (SELECT MIN(r3.sort_order)
     FROM public.memberships m2
     JOIN public.roles r3 ON r3.id = m2.role_id
     WHERE m2.user_id = (SELECT auth.uid()) AND m2.is_active = true)
  )
);
-- SECURITY FIX: Replace overly permissive memberships_own_only (ALL) policy
-- with granular per-operation policies to prevent privilege escalation.

DROP POLICY IF EXISTS "memberships_own_only" ON public.memberships;

CREATE POLICY "memberships_select_own"
ON public.memberships FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "memberships_insert_authorized"
ON public.memberships FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = (select auth.uid())
    AND r.code IN (
      'admin_platform','super_admin','admin',
      'admin_org','manager','gestionnaire','syndic'
    )
    AND m.is_active = true
  )
);

CREATE POLICY "memberships_update_admin_only"
ON public.memberships FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = (select auth.uid())
    AND r.code IN (
      'admin_platform','super_admin','admin_org'
    )
    AND m.is_active = true
  )
);

CREATE POLICY "memberships_delete_admin_only"
ON public.memberships FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = (select auth.uid())
    AND r.code IN (
      'admin_platform','super_admin','admin_org'
    )
    AND m.is_active = true
  )
);
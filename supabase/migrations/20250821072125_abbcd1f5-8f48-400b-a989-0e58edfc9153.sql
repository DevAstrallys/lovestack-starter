-- Corriger les politiques RLS pour la table companies
DROP POLICY IF EXISTS "companies_read_permitted" ON public.companies;

CREATE POLICY "Companies can be viewed by organization members"
ON public.companies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true
    AND m.company_id = companies.id
  )
  OR
  EXISTS (
    SELECT 1 FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
  )
);

CREATE POLICY "Platform admins can manage companies"
ON public.companies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
  )
);

-- Corriger les politiques RLS pour la table profiles  
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_write_own" ON public.profiles;

-- Seuls les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can only view their own profile"
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Seuls les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can only update their own profile"
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

-- Seuls les utilisateurs peuvent créer leur propre profil
CREATE POLICY "Users can only create their own profile"
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid());

-- Les administrateurs peuvent voir tous les profils pour la gestion
CREATE POLICY "Platform admins can view all profiles"
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
  )
);

-- Vérifier les politiques pour channels_outbox (déjà correctes mais renforcer)
DROP POLICY IF EXISTS "Platform admins can view communication logs" ON public.channels_outbox;

CREATE POLICY "Only platform admins can view communication logs"
ON public.channels_outbox 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
  )
);

-- Vérifier les politiques pour audit_logs (déjà correctes)
DROP POLICY IF EXISTS "audit_logs_admin_only" ON public.audit_logs;

CREATE POLICY "Only platform admins can access audit logs"
ON public.audit_logs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform'
  )
);
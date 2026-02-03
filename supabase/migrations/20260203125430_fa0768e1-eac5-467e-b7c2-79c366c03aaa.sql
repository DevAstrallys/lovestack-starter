-- Fix fn_has_perm function: memberships table has organization_id, not building_id
-- The function should check permissions via the building's organization

CREATE OR REPLACE FUNCTION public.fn_has_perm(uid uuid, bld uuid, perm_code text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.memberships m
    join public.roles r on r.id = m.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    join public.buildings b on b.id = bld
    where m.user_id = uid
      and m.organization_id = b.organization_id
      and m.is_active
      and p.code = perm_code
  );
$function$;
-- Add RLS policy to allow platform admins and organization members to view QR-created tickets
-- These tickets have no building_id or created_by, but have organization_id in meta

CREATE POLICY "Platform admins can view all tickets" 
ON public.tickets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true 
    AND r.code = 'admin_platform' 
    AND r.is_platform_scope = true
  )
);

CREATE POLICY "Organization members can view QR-created tickets" 
ON public.tickets 
FOR SELECT 
USING (
  source = 'qr_code' 
  AND meta ? 'organization_id'
  AND (meta->>'organization_id')::uuid IN (
    SELECT m.organization_id 
    FROM memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true
  )
);
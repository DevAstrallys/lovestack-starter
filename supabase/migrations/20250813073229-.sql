-- Enable Row Level Security on channels_outbox table
ALTER TABLE public.channels_outbox ENABLE ROW LEVEL SECURITY;

-- Only platform admins can read communication logs for auditing purposes
CREATE POLICY "Platform admins can view communication logs" 
ON public.channels_outbox 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
      AND m.is_active = true 
      AND r.code = 'admin_platform'
  )
);

-- Only system processes can insert into outbox (no direct user access)
CREATE POLICY "System only can queue communications" 
ON public.channels_outbox 
FOR INSERT 
WITH CHECK (false);

-- Only system processes can update communication status
CREATE POLICY "System only can update communication status" 
ON public.channels_outbox 
FOR UPDATE 
USING (false);

-- No direct deletion allowed
CREATE POLICY "No direct deletion of communications" 
ON public.channels_outbox 
FOR DELETE 
USING (false);
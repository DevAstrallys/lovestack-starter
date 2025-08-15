-- Create test user with known credentials
-- This will insert a test user directly into auth.users if needed

-- First, let's check current user and create a profile if missing
DO $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current authenticated user if any
    current_user_id := auth.uid();
    
    -- If we have a current user, create their profile
    IF current_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, full_name, locale)
        VALUES (current_user_id, 'Administrateur Test', 'fr')
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            locale = EXCLUDED.locale;
            
        -- Ensure this user has platform admin role
        INSERT INTO public.memberships (user_id, role_id, is_active)
        SELECT 
            current_user_id,
            r.id,
            true
        FROM public.roles r
        WHERE r.code = 'admin_platform'
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
-- Create test user admin@test.com with password admin123!
-- Insert directly into auth.users table

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  confirmation_token,
  recovery_sent_at,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('admin123!', gen_salt('bf')),
  now(),
  now(),
  '',
  null,
  '',
  '',
  '',
  null,
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin Test"}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  null,
  '',
  0,
  null,
  '',
  null,
  false,
  null
) ON CONFLICT (email) DO NOTHING;

-- Create profile for this user
INSERT INTO public.profiles (id, full_name, locale)
SELECT 
  id,
  'Admin Test',
  'fr'
FROM auth.users 
WHERE email = 'admin@test.com'
ON CONFLICT (id) DO NOTHING;
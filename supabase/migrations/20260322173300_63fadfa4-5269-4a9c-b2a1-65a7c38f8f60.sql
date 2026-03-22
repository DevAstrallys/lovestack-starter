-- Security fix: remove hardcoded test user admin@test.com if it still exists
DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@test.com');
DELETE FROM public.memberships WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@test.com');
DELETE FROM auth.users WHERE email = 'admin@test.com';
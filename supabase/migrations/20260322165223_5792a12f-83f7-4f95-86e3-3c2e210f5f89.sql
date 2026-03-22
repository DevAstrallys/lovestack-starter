-- SECURITY FIX: Remove hardcoded test user (admin@test.com / admin123!)
-- created by migration 20250815163004

DELETE FROM public.profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@test.com'
);

DELETE FROM auth.users WHERE email = 'admin@test.com';
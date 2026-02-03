-- Replace overly permissive QR-code insert policy with a constrained one
DO $$
BEGIN
  -- Drop previous policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tickets'
      AND policyname = 'Anyone can create tickets via QR code'
  ) THEN
    EXECUTE 'DROP POLICY "Anyone can create tickets via QR code" ON public.tickets';
  END IF;
END $$;

CREATE POLICY "Public can create tickets via active QR code"
ON public.tickets
FOR INSERT
WITH CHECK (
  source = 'qr_code'
  AND (meta ? 'qr_code_id')
  AND (meta->>'qr_code_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1
    FROM public.qr_codes q
    WHERE q.id = (meta->>'qr_code_id')::uuid
      AND q.is_active = true
  )
);
-- Allow public ticket creation for QR code submissions
CREATE POLICY "Anyone can create tickets via QR code"
ON public.tickets
FOR INSERT
WITH CHECK (source = 'qr_code');

-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', true);

-- Allow anyone to upload (QR tickets can be anonymous)
CREATE POLICY "Anyone can upload ticket attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ticket-attachments');

-- Allow anyone to read ticket attachments
CREATE POLICY "Anyone can read ticket attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-attachments');

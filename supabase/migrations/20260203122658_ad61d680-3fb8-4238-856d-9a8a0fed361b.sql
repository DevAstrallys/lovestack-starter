-- Make building_id nullable on tickets table to allow tickets from QR codes without building
ALTER TABLE public.tickets ALTER COLUMN building_id DROP NOT NULL;
-- Add relationship between buildings and organizations
-- First, add organization_id to buildings table
ALTER TABLE public.buildings 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Update existing buildings to link them to organizations
UPDATE public.buildings 
SET organization_id = (
    SELECT id FROM public.organizations 
    WHERE name = 'Résidence Les Jardins' 
    LIMIT 1
)
WHERE name = 'Résidence Test Legacy';

UPDATE public.buildings 
SET organization_id = (
    SELECT id FROM public.organizations 
    WHERE name = 'Immeuble Central Plaza' 
    LIMIT 1
)
WHERE name = 'Immeuble Test Legacy';

-- Create some tickets with proper building relationships
INSERT INTO public.tickets (
  building_id, title, description, status, priority, category_code, nature_code,
  reporter_name, reporter_email, reporter_phone, source, communication_mode, language,
  location, meta
)
SELECT 
  b.id,
  'Fuite d''eau appartement 201',
  'Importante fuite dans la salle de bain de l''appartement 201. Intervention urgente requise.',
  'open',
  'high',
  'plumbing',
  'water_leak',
  'Marie Dubois',
  'marie.dubois@test.com',
  '0123456789',
  'mobile_app',
  'email',
  'fr',
  '{"building": "Résidence Test", "floor": 2, "apartment": "201", "room": "bathroom"}',
  '{"photos": ["leak1.jpg"], "urgency_level": "high"}'
FROM buildings b 
JOIN organizations o ON o.id = b.organization_id
WHERE o.name = 'Résidence Les Jardins'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.tickets (
  building_id, title, description, status, priority, category_code, nature_code,
  reporter_name, reporter_email, reporter_phone, source, communication_mode, language,
  location, meta
)
SELECT 
  b.id,
  'Éclairage défaillant hall d''entrée',
  'Les néons du hall d''entrée ne fonctionnent plus depuis ce matin.',
  'in_progress',
  'medium',
  'electricity',
  'faulty_lighting',
  'Jean Martin',
  'jean.martin@test.com',
  '0987654321',
  'web_portal',
  'sms',
  'fr',
  '{"building": "Immeuble Central", "area": "entrance_hall"}',
  '{"reported_time": "2024-01-15T08:30:00Z"}'
FROM buildings b 
JOIN organizations o ON o.id = b.organization_id
WHERE o.name = 'Immeuble Central Plaza'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.tickets (
  building_id, title, description, status, priority, category_code, nature_code,
  reporter_name, reporter_email, reporter_phone, source, communication_mode, language,
  location, meta
)
SELECT 
  b.id,
  'Demande de nettoyage escaliers',
  'Les escaliers des étages 3 à 5 nécessitent un nettoyage en profondeur.',
  'open',
  'low',
  'cleaning',
  'common_areas',
  'Sophie Laurent',
  'sophie.laurent@test.com',
  '0147258369',
  'phone',
  'email',
  'fr',
  '{"building": "Résidence Test", "areas": ["stairs"], "floors": ["3", "4", "5"]}',
  '{"cleaning_type": "deep_clean", "frequency": "one_time"}'
FROM buildings b 
JOIN organizations o ON o.id = b.organization_id
WHERE o.name = 'Résidence Les Jardins'
LIMIT 1
ON CONFLICT DO NOTHING;
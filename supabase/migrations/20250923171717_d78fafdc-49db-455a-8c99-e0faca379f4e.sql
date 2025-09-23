-- Add simple test data for tickets

-- Insert some tickets with test data
INSERT INTO public.tickets (
  building_id, title, description, status, priority, category_code, nature_code,
  reporter_name, reporter_email, reporter_phone, source, communication_mode, language,
  location, meta
)
SELECT 
  b.id,
  'Fuite d''eau dans les toilettes',
  'Il y a une fuite importante dans les toilettes de l''appartement. L''eau coule en continu.',
  'open',
  'high',
  'plumbing',
  'water_leak',
  'Marie Dubois',
  'marie.dubois@email.com',
  '0123456789',
  'mobile_app',
  'email',
  'fr',
  '{"building": "Résidence Test", "floor": 2, "apartment": "201"}',
  '{"photos": ["leak1.jpg"], "urgency_level": "high"}'
FROM buildings b 
LIMIT 1;

INSERT INTO public.tickets (
  building_id, title, description, status, priority, category_code, nature_code,
  reporter_name, reporter_email, reporter_phone, source, communication_mode, language,
  location, meta
)
SELECT 
  b.id,
  'Panne d''éclairage dans le couloir',
  'L''éclairage du couloir du 3ème étage ne fonctionne plus depuis hier soir.',
  'in_progress',
  'medium',
  'electricity',
  'faulty_lighting',
  'Jean Martin',
  'jean.martin@email.com',
  '0987654321',
  'web_portal',
  'sms',
  'fr',
  '{"building": "Résidence Test", "floor": 3, "area": "corridor"}',
  '{"reported_time": "2024-01-15T20:30:00Z"}'
FROM buildings b 
LIMIT 1;

INSERT INTO public.tickets (
  building_id, title, description, status, priority, category_code, nature_code,
  reporter_name, reporter_email, reporter_phone, source, communication_mode, language,
  location, meta
)
SELECT 
  b.id,
  'Demande de nettoyage parties communes',
  'Les parties communes nécessitent un nettoyage approfondi suite à des travaux.',
  'open',
  'low',
  'cleaning',
  'common_areas',
  'Sophie Leroy',
  'sophie.leroy@email.com',
  '0147258369',
  'phone',
  'email',
  'fr',
  '{"building": "Immeuble Test", "areas": ["hall", "escaliers", "couloirs"]}',
  '{"work_completed": "2024-01-14", "cleaning_type": "deep_clean"}'
FROM buildings b 
ORDER BY b.created_at DESC
LIMIT 1;

INSERT INTO public.tickets (
  building_id, title, description, status, priority, category_code, nature_code,
  reporter_name, reporter_email, reporter_phone, source, communication_mode, language,
  location, meta
)
SELECT 
  b.id,
  'Radiateur qui ne chauffe pas',
  'Le radiateur de la chambre principale ne chauffe plus depuis une semaine.',
  'closed',
  'medium',
  'heating',
  'cold_radiator',
  'Pierre Durand',
  'pierre.durand@email.com',
  '0698765432',
  'mobile_app',
  'push',
  'fr',
  '{"building": "Résidence Test", "floor": 1, "apartment": "105", "room": "bedroom"}',
  '{"temperature_reported": 15, "outside_temp": 2}'
FROM buildings b 
LIMIT 1;

INSERT INTO public.tickets (
  building_id, title, description, status, priority, category_code, nature_code,
  reporter_name, reporter_email, reporter_phone, source, communication_mode, language,
  location, meta
)
SELECT 
  b.id,
  'Problème d''ascenseur',
  'L''ascenseur principal fait des bruits étranges et s''arrête parfois entre les étages.',
  'open',
  'high',
  'mechanical',
  'elevator_issue',
  'Lucien Moreau',
  'lucien.moreau@email.com',
  '0612345678',
  'phone',
  'email',
  'fr',
  '{"building": "Tour", "elevator": "principal", "floors": "tous"}',
  '{"last_incident": "2024-01-16T10:15:00Z", "frequency": "daily"}'
FROM buildings b 
ORDER BY b.created_at DESC
LIMIT 1;
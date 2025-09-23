-- Insert test data using gen_random_uuid() for valid UUIDs

-- 1. Tax actions
INSERT INTO public.tax_actions (label, key) VALUES
('Signaler un problème', 'report_issue'),
('Demander une intervention', 'request_service'),
('Information générale', 'general_info');

-- 2. Tax categories (get the action IDs first)
INSERT INTO public.tax_categories (action_id, label, key, label_i18n) 
SELECT a.id, 'Plomberie', 'plumbing', '{"fr": "Plomberie", "en": "Plumbing"}'
FROM tax_actions a WHERE a.key = 'report_issue';

INSERT INTO public.tax_categories (action_id, label, key, label_i18n) 
SELECT a.id, 'Électricité', 'electricity', '{"fr": "Électricité", "en": "Electricity"}'
FROM tax_actions a WHERE a.key = 'report_issue';

INSERT INTO public.tax_categories (action_id, label, key, label_i18n) 
SELECT a.id, 'Chauffage', 'heating', '{"fr": "Chauffage", "en": "Heating"}'
FROM tax_actions a WHERE a.key = 'report_issue';

INSERT INTO public.tax_categories (action_id, label, key, label_i18n) 
SELECT a.id, 'Nettoyage', 'cleaning', '{"fr": "Nettoyage", "en": "Cleaning"}'
FROM tax_actions a WHERE a.key = 'request_service';

INSERT INTO public.tax_categories (action_id, label, key, label_i18n) 
SELECT a.id, 'Jardinage', 'gardening', '{"fr": "Jardinage", "en": "Gardening"}'
FROM tax_actions a WHERE a.key = 'request_service';

-- 3. Tax objects
INSERT INTO public.tax_objects (category_id, label, key, label_i18n) 
SELECT c.id, 'Fuite d''eau', 'water_leak', '{"fr": "Fuite d''eau", "en": "Water leak"}'
FROM tax_categories c WHERE c.key = 'plumbing';

INSERT INTO public.tax_objects (category_id, label, key, label_i18n) 
SELECT c.id, 'WC bouché', 'blocked_toilet', '{"fr": "WC bouché", "en": "Blocked toilet"}'
FROM tax_categories c WHERE c.key = 'plumbing';

INSERT INTO public.tax_objects (category_id, label, key, label_i18n) 
SELECT c.id, 'Panne électrique', 'power_outage', '{"fr": "Panne électrique", "en": "Power outage"}'
FROM tax_categories c WHERE c.key = 'electricity';

INSERT INTO public.tax_objects (category_id, label, key, label_i18n) 
SELECT c.id, 'Éclairage défaillant', 'faulty_lighting', '{"fr": "Éclairage défaillant", "en": "Faulty lighting"}'
FROM tax_categories c WHERE c.key = 'electricity';

INSERT INTO public.tax_objects (category_id, label, key, label_i18n) 
SELECT c.id, 'Radiateur froid', 'cold_radiator', '{"fr": "Radiateur froid", "en": "Cold radiator"}'
FROM tax_categories c WHERE c.key = 'heating';

INSERT INTO public.tax_objects (category_id, label, key, label_i18n) 
SELECT c.id, 'Parties communes', 'common_areas', '{"fr": "Parties communes", "en": "Common areas"}'
FROM tax_categories c WHERE c.key = 'cleaning';

INSERT INTO public.tax_objects (category_id, label, key, label_i18n) 
SELECT c.id, 'Espaces verts', 'green_spaces', '{"fr": "Espaces verts", "en": "Green spaces"}'
FROM tax_categories c WHERE c.key = 'gardening';

-- 4. Organizations
INSERT INTO public.organizations (name, description, address, zip_code, city, country, is_active) VALUES
('Résidence Les Jardins', 'Résidence moderne avec espaces verts', '123 Avenue des Fleurs', '75001', 'Paris', 'FR', true),
('Immeuble Central Plaza', 'Complexe commercial et résidentiel', '456 Boulevard du Commerce', '69002', 'Lyon', 'FR', true),
('Résidence Villa Marina', 'Résidence de standing vue mer', '789 Promenade des Anglais', '06000', 'Nice', 'FR', true);

-- 5. Buildings (legacy table)
INSERT INTO public.buildings (name, address, city, zip_code, country, timezone, is_active) VALUES
('Résidence Test Legacy', '999 Rue de Test', 'Marseille', '13001', 'FR', 'Europe/Paris', true),
('Immeuble Test Legacy', '888 Avenue Test', 'Toulouse', '31000', 'FR', 'Europe/Paris', true);

-- 6. Companies
INSERT INTO public.companies (name, siret, email, phone, address, city, zip_code, rating, tags) VALUES
('Plomberie Dupont', '12345678901234', 'contact@plomberie-dupont.fr', '0123456789', '10 Rue des Artisans', 'Paris', '75010', 4.5, ARRAY['plomberie', 'chauffage']),
('Électricité Martin', '56789012345678', 'info@elec-martin.fr', '0987654321', '25 Avenue de l''Industrie', 'Lyon', '69003', 4.2, ARRAY['électricité', 'domotique']),
('Nettoyage ProClean', '98765432109876', 'service@proclean.fr', '0147258369', '5 Boulevard du Service', 'Nice', '06100', 4.8, ARRAY['nettoyage', 'entretien']);

-- 7. Locations (simple locations table)
INSERT INTO public.locations (name, code) VALUES
('Paris Centre', 'PAR-01'),
('Lyon Métropole', 'LYN-01'),
('Nice Côte d''Azur', 'NCE-01'),
('Marseille Sud', 'MAR-01');

-- 8. Equipment
INSERT INTO public.equipment (building_id, location, ref, type_code)
SELECT b.id, '{"floor": 1, "room": "chaufferie"}', 'CHAUD-001', 'boiler'
FROM buildings b WHERE b.name = 'Résidence Test Legacy' LIMIT 1;

INSERT INTO public.equipment (building_id, location, ref, type_code)
SELECT b.id, '{"floor": 0, "area": "parking"}', 'VENT-001', 'ventilation'
FROM buildings b WHERE b.name = 'Résidence Test Legacy' LIMIT 1;

INSERT INTO public.equipment (building_id, location, ref, type_code)
SELECT b.id, '{"floor": 5, "room": "technique"}', 'ELEV-001', 'elevator'
FROM buildings b WHERE b.name = 'Immeuble Test Legacy' LIMIT 1;

INSERT INTO public.equipment (building_id, location, ref, type_code)
SELECT b.id, '{"floor": 0, "area": "entrance"}', 'SECU-001', 'security_system'
FROM buildings b WHERE b.name = 'Immeuble Test Legacy' LIMIT 1;

-- 9. QR Codes
INSERT INTO public.qr_codes (building_id, display_label, target_slug, version, is_active, last_regenerated_at)
SELECT b.id, 'Entrée principale', 'entrance-main', 1, true, now()
FROM buildings b WHERE b.name = 'Résidence Test Legacy' LIMIT 1;

INSERT INTO public.qr_codes (building_id, display_label, target_slug, version, is_active, last_regenerated_at)
SELECT b.id, 'Parking souterrain', 'parking-basement', 1, true, now()
FROM buildings b WHERE b.name = 'Résidence Test Legacy' LIMIT 1;

INSERT INTO public.qr_codes (building_id, display_label, target_slug, version, is_active, last_regenerated_at)
SELECT b.id, 'Hall d''accueil', 'lobby-main', 2, true, now()
FROM buildings b WHERE b.name = 'Immeuble Test Legacy' LIMIT 1;
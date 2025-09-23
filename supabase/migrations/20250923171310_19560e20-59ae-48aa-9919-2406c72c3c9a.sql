-- Insert test data for all database tables (valid UUIDs)

-- 1. Organizations
INSERT INTO public.organizations (id, name, description, address, zip_code, city, country, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Résidence Les Jardins', 'Résidence moderne avec espaces verts', '123 Avenue des Fleurs', '75001', 'Paris', 'FR', true),
('22222222-2222-2222-2222-222222222222', 'Immeuble Central Plaza', 'Complexe commercial et résidentiel', '456 Boulevard du Commerce', '69002', 'Lyon', 'FR', true),
('33333333-3333-3333-3333-333333333333', 'Résidence Villa Marina', 'Résidence de standing vue mer', '789 Promenade des Anglais', '06000', 'Nice', 'FR', true);

-- 2. Location tags
INSERT INTO public.location_tags (id, organization_id, name, color) VALUES
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Urgent', '#ef4444'),
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Maintenance', '#f97316'),
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Sécurité', '#eab308'),
('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'Priorité haute', '#dc2626'),
('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'Nettoyage', '#16a34a');

-- 3. Location ensembles
INSERT INTO public.location_ensembles (id, organization_id, name, description) VALUES
('aaaaaaaa-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Bâtiment A', 'Bâtiment principal résidentiel'),
('bbbbbbbb-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Bâtiment B', 'Bâtiment secondaire avec commerces'),
('cccccccc-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Tour Nord', 'Tour de bureaux côté nord'),
('dddddddd-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Tour Sud', 'Tour résidentielle côté sud');

-- 4. Location groups
INSERT INTO public.location_groups (id, organization_id, parent_id, name, description) VALUES
('eeeeeeee-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, 'Étage 1', 'Premier étage Bâtiment A'),
('ffffffff-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', NULL, 'Étage 2', 'Deuxième étage Bâtiment A'),
('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', NULL, 'Rez-de-chaussée', 'RDC Bâtiment B avec commerces'),
('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', NULL, 'Niveau 10-15', 'Étages 10 à 15 Tour Nord'),
('33333333-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', NULL, 'Niveau 1-5', 'Étages 1 à 5 Tour Sud');

-- 5. Location elements
INSERT INTO public.location_elements (id, organization_id, parent_id, name, description, location_data) VALUES
('1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', '11111111-1111-1111-1111-111111111111', 'eeeeeeee-1111-1111-1111-111111111111', 'Appartement 101', 'Appartement 3 pièces', '{"type": "apartment", "surface": 75, "rooms": 3}'),
('2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', '11111111-1111-1111-1111-111111111111', 'eeeeeeee-1111-1111-1111-111111111111', 'Appartement 102', 'Appartement 2 pièces', '{"type": "apartment", "surface": 55, "rooms": 2}'),
('3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', '11111111-1111-1111-1111-111111111111', 'ffffffff-2222-2222-2222-222222222222', 'Appartement 201', 'Appartement 4 pièces', '{"type": "apartment", "surface": 95, "rooms": 4}'),
('4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Boulangerie', 'Commerce de proximité', '{"type": "commercial", "activity": "bakery"}'),
('5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bureau 1001', 'Bureau direction', '{"type": "office", "surface": 120}'),
('6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f', '22222222-2222-2222-2222-222222222222', '33333333-cccc-cccc-cccc-cccccccccccc', 'Appartement 301', 'Appartement de standing', '{"type": "apartment", "surface": 110, "rooms": 4}');

-- 6. Buildings (legacy table)
INSERT INTO public.buildings (id, name, address, city, zip_code, country, timezone, is_active) VALUES
('b1111111-1111-1111-1111-111111111111', 'Résidence Test Legacy', '999 Rue de Test', 'Marseille', '13001', 'FR', 'Europe/Paris', true),
('b2222222-2222-2222-2222-222222222222', 'Immeuble Test Legacy', '888 Avenue Test', 'Toulouse', '31000', 'FR', 'Europe/Paris', true);

-- 7. Companies
INSERT INTO public.companies (id, name, siret, email, phone, address, city, zip_code, rating, tags) VALUES
('c1111111-1111-1111-1111-111111111111', 'Plomberie Dupont', '12345678901234', 'contact@plomberie-dupont.fr', '0123456789', '10 Rue des Artisans', 'Paris', '75010', 4.5, ARRAY['plomberie', 'chauffage']),
('c2222222-2222-2222-2222-222222222222', 'Électricité Martin', '56789012345678', 'info@elec-martin.fr', '0987654321', '25 Avenue de l''Industrie', 'Lyon', '69003', 4.2, ARRAY['électricité', 'domotique']),
('c3333333-3333-3333-3333-333333333333', 'Nettoyage ProClean', '98765432109876', 'service@proclean.fr', '0147258369', '5 Boulevard du Service', 'Nice', '06100', 4.8, ARRAY['nettoyage', 'entretien']);

-- 8. Tax actions
INSERT INTO public.tax_actions (id, label, key) VALUES
('a1111111-1111-1111-1111-111111111111', 'Signaler un problème', 'report_issue'),
('a2222222-2222-2222-2222-222222222222', 'Demander une intervention', 'request_service'),
('a3333333-3333-3333-3333-333333333333', 'Information générale', 'general_info');

-- 9. Tax categories
INSERT INTO public.tax_categories (id, action_id, label, key, label_i18n) VALUES
('ca111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Plomberie', 'plumbing', '{"fr": "Plomberie", "en": "Plumbing"}'),
('ca222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Électricité', 'electricity', '{"fr": "Électricité", "en": "Electricity"}'),
('ca333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'Chauffage', 'heating', '{"fr": "Chauffage", "en": "Heating"}'),
('ca444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 'Nettoyage', 'cleaning', '{"fr": "Nettoyage", "en": "Cleaning"}'),
('ca555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222222', 'Jardinage', 'gardening', '{"fr": "Jardinage", "en": "Gardening"}');

-- 10. Tax objects
INSERT INTO public.tax_objects (id, category_id, label, key, label_i18n) VALUES
('01111111-1111-1111-1111-111111111111', 'ca111111-1111-1111-1111-111111111111', 'Fuite d''eau', 'water_leak', '{"fr": "Fuite d''eau", "en": "Water leak"}'),
('02222222-2222-2222-2222-222222222222', 'ca111111-1111-1111-1111-111111111111', 'WC bouché', 'blocked_toilet', '{"fr": "WC bouché", "en": "Blocked toilet"}'),
('03333333-3333-3333-3333-333333333333', 'ca222222-2222-2222-2222-222222222222', 'Panne électrique', 'power_outage', '{"fr": "Panne électrique", "en": "Power outage"}'),
('04444444-4444-4444-4444-444444444444', 'ca222222-2222-2222-2222-222222222222', 'Éclairage défaillant', 'faulty_lighting', '{"fr": "Éclairage défaillant", "en": "Faulty lighting"}'),
('05555555-5555-5555-5555-555555555555', 'ca333333-3333-3333-3333-333333333333', 'Radiateur froid', 'cold_radiator', '{"fr": "Radiateur froid", "en": "Cold radiator"}'),
('06666666-6666-6666-6666-666666666666', 'ca444444-4444-4444-4444-444444444444', 'Parties communes', 'common_areas', '{"fr": "Parties communes", "en": "Common areas"}'),
('07777777-7777-7777-7777-777777777777', 'ca555555-5555-5555-5555-555555555555', 'Espaces verts', 'green_spaces', '{"fr": "Espaces verts", "en": "Green spaces"}');

-- 11. Equipment
INSERT INTO public.equipment (id, building_id, location, ref, type_code) VALUES
('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '{"floor": 1, "room": "chaufferie"}', 'CHAUD-001', 'boiler'),
('e2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', '{"floor": 0, "area": "parking"}', 'VENT-001', 'ventilation'),
('e3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', '{"floor": 5, "room": "technique"}', 'ELEV-001', 'elevator'),
('e4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', '{"floor": 0, "area": "entrance"}', 'SECU-001', 'security_system');

-- 12. QR Codes
INSERT INTO public.qr_codes (id, building_id, location_element_id, display_label, target_slug, version, is_active, last_regenerated_at) VALUES
('q1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', NULL, 'Entrée principale', 'entrance-main', 1, true, now()),
('q2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', NULL, 'Parking souterrain', 'parking-basement', 1, true, now()),
('q3333333-3333-3333-3333-333333333333', NULL, '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 'Appartement 101', 'apt-101', 1, true, now()),
('q4444444-4444-4444-4444-444444444444', NULL, '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', 'Boulangerie RDC', 'bakery-ground', 1, true, now()),
('q5555555-5555-5555-5555-555555555555', 'b2222222-2222-2222-2222-222222222222', NULL, 'Hall d''accueil', 'lobby-main', 2, true, now());

-- 13. Tickets
INSERT INTO public.tickets (
  id, building_id, title, description, status, priority, category_code, nature_code,
  reporter_name, reporter_email, reporter_phone, source, communication_mode, language,
  location, meta, created_by, assigned_to, category_id, object_id
) VALUES
('t1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 
  'Fuite d''eau dans les toilettes', 
  'Il y a une fuite importante dans les toilettes de l''appartement. L''eau coule en continu.',
  'open', 'high', 'plumbing', 'water_leak',
  'Marie Dubois', 'marie.dubois@email.com', '0123456789', 'mobile_app', 'email', 'fr',
  '{"building": "Résidence Test", "floor": 2, "apartment": "201"}',
  '{"photos": ["leak1.jpg"], "urgency_level": "high"}',
  NULL, NULL, 'ca111111-1111-1111-1111-111111111111', '01111111-1111-1111-1111-111111111111'),

('t2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111',
  'Panne d''éclairage dans le couloir',
  'L''éclairage du couloir du 3ème étage ne fonctionne plus depuis hier soir.',
  'in_progress', 'medium', 'electricity', 'faulty_lighting',
  'Jean Martin', 'jean.martin@email.com', '0987654321', 'web_portal', 'sms', 'fr',
  '{"building": "Résidence Test", "floor": 3, "area": "corridor"}',
  '{"reported_time": "2024-01-15T20:30:00Z"}',
  NULL, NULL, 'ca222222-2222-2222-2222-222222222222', '04444444-4444-4444-4444-444444444444'),

('t3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222',
  'Demande de nettoyage parties communes',
  'Les parties communes nécessitent un nettoyage approfondi suite à des travaux.',
  'open', 'low', 'cleaning', 'common_areas',
  'Sophie Leroy', 'sophie.leroy@email.com', '0147258369', 'phone', 'email', 'fr',
  '{"building": "Immeuble Test", "areas": ["hall", "escaliers", "couloirs"]}',
  '{"work_completed": "2024-01-14", "cleaning_type": "deep_clean"}',
  NULL, NULL, 'ca444444-4444-4444-4444-444444444444', '06666666-6666-6666-6666-666666666666'),

('t4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111',
  'Radiateur qui ne chauffe pas',
  'Le radiateur de la chambre principale ne chauffe plus depuis une semaine.',
  'closed', 'medium', 'heating', 'cold_radiator',
  'Pierre Durand', 'pierre.durand@email.com', '0698765432', 'mobile_app', 'push', 'fr',
  '{"building": "Résidence Test", "floor": 1, "apartment": "105", "room": "bedroom"}',
  '{"temperature_reported": 15, "outside_temp": 2}',
  NULL, NULL, 'ca333333-3333-3333-3333-333333333333', '05555555-5555-5555-5555-555555555555');

-- 14. Ticket Activities
INSERT INTO public.ticket_activities (
  id, ticket_id, actor_id, activity_type, content, old_value, new_value, is_internal, metadata
) VALUES
('ta111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111', NULL, 'comment', 
  'Ticket créé automatiquement depuis l''application mobile', NULL, NULL, false, '{"source": "system"}'),

('ta222222-2222-2222-2222-222222222222', 't2222222-2222-2222-2222-222222222222', NULL, 'status_change',
  'Ticket pris en charge par l''équipe technique', 'open', 'in_progress', false, '{"assigned_team": "electrical"}'),

('ta333333-3333-3333-3333-333333333333', 't4444444-4444-4444-4444-444444444444', NULL, 'status_change',
  'Intervention terminée - Radiateur réparé', 'in_progress', 'closed', false, '{"completion_time": "2024-01-16T14:30:00Z"}'),

('ta444444-4444-4444-4444-444444444444', 't1111111-1111-1111-1111-111111111111', NULL, 'comment',
  'Photo supplémentaire envoyée par le locataire', NULL, NULL, false, '{"attachment": "leak2.jpg"}');

-- 15. Locations (simple locations table)
INSERT INTO public.locations (id, name, code) VALUES
('l1111111-1111-1111-1111-111111111111', 'Paris Centre', 'PAR-01'),
('l2222222-2222-2222-2222-222222222222', 'Lyon Métropole', 'LYN-01'),
('l3333333-3333-3333-3333-333333333333', 'Nice Côte d''Azur', 'NCE-01'),
('l4444444-4444-4444-4444-444444444444', 'Marseille Sud', 'MAR-01');

-- Associate some elements with tags
INSERT INTO public.location_element_tags (element_id, tag_id) VALUES
('1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', '44444444-4444-4444-4444-444444444444'),
('4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', '55555555-5555-5555-5555-555555555555'),
('5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e', '77777777-7777-7777-7777-777777777777');

-- Associate some groups with tags  
INSERT INTO public.location_group_tags (group_id, tag_id) VALUES
('eeeeeeee-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666'),
('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '88888888-8888-8888-8888-888888888888');

-- Associate ensembles with groups
INSERT INTO public.location_ensemble_groups (ensemble_id, group_id) VALUES
('aaaaaaaa-1111-1111-1111-111111111111', 'eeeeeeee-1111-1111-1111-111111111111'),
('aaaaaaaa-1111-1111-1111-111111111111', 'ffffffff-2222-2222-2222-222222222222'),
('bbbbbbbb-2222-2222-2222-222222222222', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('cccccccc-3333-3333-3333-333333333333', '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('dddddddd-4444-4444-4444-444444444444', '33333333-cccc-cccc-cccc-cccccccccccc');

-- Associate groups with elements
INSERT INTO public.location_group_elements (group_id, element_id) VALUES
('eeeeeeee-1111-1111-1111-111111111111', '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a'),
('eeeeeeee-1111-1111-1111-111111111111', '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b'),
('ffffffff-2222-2222-2222-222222222222', '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c'),
('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d'),
('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e'),
('33333333-cccc-cccc-cccc-cccccccccccc', '6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f');
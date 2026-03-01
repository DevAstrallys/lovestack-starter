
-- ============================================================
-- JEU DE DONNÉES TEST : Syndic Horizon
-- Pour supprimer : DELETE FROM organizations WHERE id = 'a0000001-0000-0000-0000-000000000001';
-- ============================================================

-- 1. Organisation
INSERT INTO organizations (id, name, description, is_active)
VALUES ('a0000001-0000-0000-0000-000000000001', 'Syndic Horizon', 'Organisation de test pour validation Kanban & Fiche Détail', true);

-- 2. Immeubles
INSERT INTO buildings (id, organization_id, name, address, city, zip_code)
VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Résidence Les Pins', '12 avenue des Pins', 'Marseille', '13008'),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Le Grand Large (Bât A)', '45 boulevard du Littoral', 'Nice', '06200'),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Le Belvédère', '8 rue du Panorama', 'Lyon', '69003');

-- 3. Ensembles
INSERT INTO location_ensembles (id, organization_id, name, description)
VALUES ('e0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Ensemble Résidence Les Pins', 'Ensemble immobilier Les Pins');

-- 4. Groupes
INSERT INTO location_groups (id, organization_id, parent_id, name, description)
VALUES ('cf000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'Bâtiment Principal', 'Bâtiment principal de la résidence');

-- 5. Éléments
INSERT INTO location_elements (id, organization_id, parent_id, name, description)
VALUES
  ('de000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'cf000001-0000-0000-0000-000000000001', 'Ascenseur Principal', 'Ascenseur cabine A'),
  ('de000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'cf000001-0000-0000-0000-000000000001', 'Parking SS-1', 'Parking souterrain niveau -1'),
  ('de000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'cf000001-0000-0000-0000-000000000001', 'Hall d''entrée', 'Hall principal RDC');

-- 6. 12 Tickets
INSERT INTO tickets (id, organization_id, building_id, title, description, status, priority, initiality, source, action_code, category_id, object_id, location, created_at, last_interaction_at, reporter_name, reporter_email, meta, attachments)
VALUES
('ff000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001',
 '[Initial] - [Je signale] - [Plomberie] - [Fuite d''eau]',
 'Fuite importante au niveau du robinet du hall d''entrée, côté boîtes aux lettres. L''eau coule en permanence et forme une flaque.',
 'open', 'urgent', 'initial', 'web', 'signaler',
 '5d4d842e-860e-4b6b-96bd-e42488e85c11', '0c9c094f-220a-49e9-9111-a692adce8fe8',
 '{"element_id": "de000001-0000-0000-0000-000000000003"}',
 now() - interval '2 days', now() - interval '1 hour',
 'Marie Dupont', 'marie.dupont@email.com', '{}',
 '[{"url": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400", "name": "fuite_hall.jpg", "type": "image/jpeg"}, {"url": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400", "name": "flaque_sol.jpg", "type": "image/jpeg"}]'),

('ff000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002',
 '[Initial] - [Je signale] - [Ascenseur] - [Bruit anormal]',
 'Bruit suspect dans l''ascenseur principal depuis ce matin. Grincement métallique lors de la montée entre le 3e et le 4e étage.',
 'open', 'high', 'initial', 'qr_code', 'signaler',
 '4b672914-19e6-43b3-a92f-7b86dd2d7586', '408489c7-2639-4c1e-b5d8-202537c50112',
 '{"element_id": "de000001-0000-0000-0000-000000000001"}',
 now() - interval '1 day', now() - interval '3 hours',
 'Jean Moreau', 'jean.moreau@email.com', '{}', '[]'),

('ff000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001',
 '[Initial] - [Je demande] - [Accès / Badge] - [Badge perdu]',
 'Badge d''accès parking perdu. Demande de remplacement urgent pour accéder au parking souterrain.',
 'open', 'medium', 'initial', 'web', 'demander',
 '7e82a6ba-1708-4868-9f2e-9899d06f62de', '5f7f72ab-293f-4b4a-b300-54c426ed52f2',
 '{"element_id": "de000001-0000-0000-0000-000000000002"}',
 now() - interval '3 days', now() - interval '6 hours',
 'Sophie Laurent', 'sophie.laurent@email.com', '{}', '[]'),

('ff000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003',
 '[Relance #1] - [Je signale] - [Parties communes] - [Graffiti / Tag]',
 'Graffitis de nouveau sur le mur du hall. Nettoyage effectué le mois dernier mais récidive.',
 'open', 'low', 'relance', 'web', 'signaler',
 'ca1a49cb-cae8-4e44-a717-f6e4762eb7c8', 'a1429db9-c0a1-439c-870d-c4bfdb276e4e',
 '{}', now() - interval '5 days', now() - interval '12 hours',
 'Pierre Martin', 'pierre.martin@email.com', '{}',
 '[{"url": "https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=400", "name": "graffiti_hall.jpg", "type": "image/jpeg"}]'),

('ff000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001',
 '[Initial] - [Je signale] - [Électricité] - [Panne d''éclairage]',
 'Les lumières du parking souterrain niveau -1 sont en panne depuis 3 jours. Zone très sombre.',
 'in_progress', 'urgent', 'initial', 'web', 'signaler',
 'da3e0e39-7fa6-4dc9-a51a-ab1b755f3462', '794017ef-7c5c-46e9-a8a3-088ab5a123ca',
 '{"element_id": "de000001-0000-0000-0000-000000000002"}',
 now() - interval '4 days', now() - interval '2 hours',
 'Fatima Benali', 'fatima.benali@email.com', '{}',
 '[{"url": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400", "name": "parking_sombre.jpg", "type": "image/jpeg"}]'),

('ff000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002',
 '[Initial] - [Je signale] - [Sécurité incendie] - [Extincteur manquant/périmé]',
 'L''extincteur du 2ème étage est périmé (date 2023). À remplacer d''urgence.',
 'in_progress', 'high', 'initial', 'web', 'signaler',
 'ae78e3bd-be2f-48a4-ae37-5091376cf758', 'f4303f17-0bfa-429b-b7c5-001a73ccc03f',
 '{}', now() - interval '6 days', now() - interval '4 hours',
 'Thomas Blanc', 'thomas.blanc@email.com', '{}', '[]'),

('ff000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003',
 '[Initial] - [Je demande] - [Intervention technique] - [Porte de garage]',
 'La porte du garage collectif ne se ferme plus correctement. Le mécanisme semble grippé.',
 'in_progress', 'medium', 'initial', 'qr_code', 'demander',
 '7c84837a-7ac6-4321-9af8-86bd739c5dea', null,
 '{}', now() - interval '7 days', now() - interval '5 hours',
 'Claire Petit', 'claire.petit@email.com', '{}', '[]'),

('ff000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001',
 '[Relance #2] - [Je signale] - [Électricité] - [Interphone / Digicode]',
 'Interphone toujours en panne malgré 2 signalements. Les visiteurs ne peuvent plus sonner.',
 'in_progress', 'high', 'relance', 'web', 'signaler',
 'da3e0e39-7fa6-4dc9-a51a-ab1b755f3462', 'aa6c2485-fa2d-4504-bb6c-e8dc8a3a3810',
 '{"element_id": "de000001-0000-0000-0000-000000000003"}',
 now() - interval '10 days', now() - interval '1 day',
 'Luc Bernard', 'luc.bernard@email.com', '{}', '[]'),

('ff000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002',
 '[Initial] - [Je signale] - [Parking] - [Barrière / Portail parking]',
 'Barrière du parking bloquée en position ouverte. En attente du technicien prévu jeudi.',
 'waiting', 'medium', 'initial', 'web', 'signaler',
 '766fff32-c036-45c2-80db-afe7fbcb7e8f', '704af12a-0f65-4b64-8254-fede73274492',
 '{"element_id": "de000001-0000-0000-0000-000000000002"}',
 now() - interval '8 days', now() - interval '2 days',
 'Nathalie Roux', 'nathalie.roux@email.com', '{}', '[]'),

('ff000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003',
 '[Initial] - [Je vérifie] - [Contrôle périodique] - [Extincteur]',
 'Vérification trimestrielle des extincteurs. En attente du rapport du prestataire SICLI.',
 'waiting', 'low', 'initial', 'web', 'verifier',
 '4ce83686-212f-4365-a520-c976e341b098', null,
 '{}', now() - interval '12 days', now() - interval '3 days',
 'Marc Girard', 'marc.girard@email.com',
 '{"signature_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Autograph_of_Benjamin_Franklin.svg/320px-Autograph_of_Benjamin_Franklin.svg.png"}',
 '[]'),

('ff000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001',
 '[Initial] - [Je signale] - [Propreté] - [Nettoyage hall]',
 'Sol du hall d''entrée très sale après travaux de peinture. Nettoyage effectué par l''équipe d''entretien.',
 'resolved', 'low', 'initial', 'web', 'signaler',
 '5d6b8343-326f-414b-a068-0c03a8006bad', null,
 '{"element_id": "de000001-0000-0000-0000-000000000003"}',
 now() - interval '15 days', now() - interval '5 days',
 'Alice Fournier', 'alice.fournier@email.com', '{}', '[]'),

('ff000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002',
 '[Initial] - [Je vérifie] - [Contrôle périodique] - [Détecteur fumée]',
 'Inspection annuelle des détecteurs de fumée. Tous conformes sauf lot 12B (remplacé). PV signé.',
 'resolved', 'medium', 'initial', 'web', 'verifier',
 '4ce83686-212f-4365-a520-c976e341b098', null,
 '{}', now() - interval '20 days', now() - interval '7 days',
 'David Leroy', 'david.leroy@email.com',
 '{"signature_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Jean_Henri_Dunant_signature.svg/320px-Jean_Henri_Dunant_signature.svg.png"}',
 '[{"url": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400", "name": "pv_controle.jpg", "type": "image/jpeg"}]');

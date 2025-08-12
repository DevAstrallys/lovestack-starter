-- Insertion des données d'exemple pour toutes les entités

-- 1. Organisations d'exemple
INSERT INTO organizations (id, name, description, address, zip_code, city, country) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Mairie de Lyon', 'Administration municipale de la ville de Lyon', '1 Place de la Comédie', '69001', 'Lyon', 'FR'),
('550e8400-e29b-41d4-a716-446655440002', 'Université Lyon 1', 'Université Claude Bernard Lyon 1', '43 Boulevard du 11 novembre 1918', '69622', 'Villeurbanne', 'FR'),
('550e8400-e29b-41d4-a716-446655440003', 'Groupe SNCF', 'Société nationale des chemins de fer français', '2 Place aux Étoiles', '93200', 'Saint-Denis', 'FR'),
('550e8400-e29b-41d4-a716-446655440004', 'Hôpital des Hospices Civils', 'Centre hospitalier universitaire de Lyon', '3 Quai des Célestins', '69002', 'Lyon', 'FR');

-- 2. Tags d'exemple pour les locations
INSERT INTO location_tags (id, name, color, organization_id) VALUES
-- Tags pour Mairie de Lyon
('tag-001', 'Accueil Public', '#3b82f6', '550e8400-e29b-41d4-a716-446655440001'),
('tag-002', 'Sécurisé', '#ef4444', '550e8400-e29b-41d4-a716-446655440001'),
('tag-003', 'Accessible PMR', '#10b981', '550e8400-e29b-41d4-a716-446655440001'),
('tag-004', 'Archive', '#6b7280', '550e8400-e29b-41d4-a716-446655440001'),
-- Tags pour Université
('tag-005', 'Laboratoire', '#8b5cf6', '550e8400-e29b-41d4-a716-446655440002'),
('tag-006', 'Amphithéâtre', '#f59e0b', '550e8400-e29b-41d4-a716-446655440002'),
('tag-007', 'Bibliothèque', '#06b6d4', '550e8400-e29b-41d4-a716-446655440002'),
-- Tags pour SNCF
('tag-008', 'Zone Critique', '#dc2626', '550e8400-e29b-41d4-a716-446655440003'),
('tag-009', 'Maintenance', '#ea580c', '550e8400-e29b-41d4-a716-446655440003'),
-- Tags pour Hôpital
('tag-010', 'Stérile', '#059669', '550e8400-e29b-41d4-a716-446655440004'),
('tag-011', 'Urgences', '#dc2626', '550e8400-e29b-41d4-a716-446655440004');

-- 3. Ensembles d'exemple
INSERT INTO location_ensembles (id, name, description, organization_id) VALUES
-- Mairie de Lyon
('ens-001', 'Hôtel de Ville', 'Bâtiment principal de la mairie avec bureaux administratifs', '550e8400-e29b-41d4-a716-446655440001'),
('ens-002', 'Annexe Sociale', 'Services sociaux et état civil', '550e8400-e29b-41d4-a716-446655440001'),
-- Université Lyon 1
('ens-003', 'Campus de la Doua', 'Campus principal avec laboratoires et amphithéâtres', '550e8400-e29b-41d4-a716-446655440002'),
('ens-004', 'Campus Rockefeller', 'Campus médical et pharmacie', '550e8400-e29b-41d4-a716-446655440002'),
-- SNCF
('ens-005', 'Gare Part-Dieu', 'Infrastructure ferroviaire principale', '550e8400-e29b-41d4-a716-446655440003'),
('ens-006', 'Centre de Maintenance', 'Ateliers de réparation et maintenance', '550e8400-e29b-41d4-a716-446655440003'),
-- Hôpital
('ens-007', 'Bâtiment Principal', 'Services généraux et administration', '550e8400-e29b-41d4-a716-446655440004'),
('ens-008', 'Pavillon Urgences', 'Services d urgences et réanimation', '550e8400-e29b-41d4-a716-446655440004');

-- 4. Groupes d'exemple
INSERT INTO location_groups (id, name, description, organization_id) VALUES
-- Mairie de Lyon
('grp-001', 'Services Citoyens', 'Guichets et services aux citoyens', '550e8400-e29b-41d4-a716-446655440001'),
('grp-002', 'Administration', 'Bureaux administratifs et direction', '550e8400-e29b-41d4-a716-446655440001'),
('grp-003', 'Archives', 'Salles d archives et stockage', '550e8400-e29b-41d4-a716-446655440001'),
-- Université Lyon 1
('grp-004', 'Laboratoires Chimie', 'Laboratoires de recherche en chimie', '550e8400-e29b-41d4-a716-446655440002'),
('grp-005', 'Amphithéâtres', 'Salles de cours magistraux', '550e8400-e29b-41d4-a716-446655440002'),
('grp-006', 'Bibliothèques', 'Espaces de documentation et étude', '550e8400-e29b-41d4-a716-446655440002'),
-- SNCF
('grp-007', 'Quais Voyageurs', 'Zones d embarquement passagers', '550e8400-e29b-41d4-a716-446655440003'),
('grp-008', 'Ateliers Maintenance', 'Zones de réparation matériel roulant', '550e8400-e29b-41d4-a716-446655440003'),
-- Hôpital
('grp-009', 'Services Urgences', 'Salles de soins urgents', '550e8400-e29b-41d4-a716-446655440004'),
('grp-010', 'Chambres Patients', 'Hébergement des patients', '550e8400-e29b-41d4-a716-446655440004');

-- 5. Éléments d'exemple
INSERT INTO location_elements (id, name, description, organization_id, location_data) VALUES
-- Mairie de Lyon
('elem-001', 'Guichet État Civil', 'Accueil pour actes d état civil', '550e8400-e29b-41d4-a716-446655440001', '{"floor": 0, "room": "001", "building": "Principal"}'),
('elem-002', 'Bureau du Maire', 'Cabinet du maire', '550e8400-e29b-41d4-a716-446655440001', '{"floor": 2, "room": "201", "building": "Principal"}'),
('elem-003', 'Salle du Conseil', 'Salle de réunion du conseil municipal', '550e8400-e29b-41d4-a716-446655440001', '{"floor": 1, "room": "150", "building": "Principal"}'),
('elem-004', 'Archive Historique', 'Stockage documents historiques', '550e8400-e29b-41d4-a716-446655440001', '{"floor": -1, "room": "B01", "building": "Principal"}'),
-- Université Lyon 1
('elem-005', 'Labo Chimie Organique', 'Laboratoire de recherche', '550e8400-e29b-41d4-a716-446655440002', '{"floor": 2, "room": "C201", "building": "Chimie"}'),
('elem-006', 'Amphi Pasteur', 'Amphithéâtre 200 places', '550e8400-e29b-41d4-a716-446655440002', '{"floor": 0, "room": "A001", "building": "Principal"}'),
('elem-007', 'Bibliothèque Sciences', 'Bibliothèque spécialisée', '550e8400-e29b-41d4-a716-446655440002', '{"floor": 1, "room": "B150", "building": "Principal"}'),
-- SNCF
('elem-008', 'Quai A', 'Quai voyageurs ligne A', '550e8400-e29b-41d4-a716-446655440003', '{"level": 0, "platform": "A", "sector": "Nord"}'),
('elem-009', 'Atelier Bogies', 'Réparation des essieux', '550e8400-e29b-41d4-a716-446655440003', '{"floor": 0, "zone": "M1", "building": "Maintenance"}'),
('elem-010', 'Poste d Aiguillage', 'Contrôle circulation trains', '550e8400-e29b-41d4-a716-446655440003', '{"floor": 3, "room": "CTL", "building": "Signalisation"}'),
-- Hôpital
('elem-011', 'Box Urgences 1', 'Salle de soins urgents', '550e8400-e29b-41d4-a716-446655440004', '{"floor": 0, "room": "U01", "wing": "Urgences"}'),
('elem-012', 'Bloc Opératoire 3', 'Salle d opération', '550e8400-e29b-41d4-a716-446655440004', '{"floor": 2, "room": "BO3", "wing": "Chirurgie"}'),
('elem-013', 'Chambre 205', 'Chambre double patients', '550e8400-e29b-41d4-a716-446655440004', '{"floor": 2, "room": "205", "wing": "Médecine"}');

-- 6. Relations ensembles-groupes
INSERT INTO location_ensemble_groups (ensemble_id, group_id) VALUES
-- Hôtel de Ville
('ens-001', 'grp-001'), -- Services Citoyens
('ens-001', 'grp-002'), -- Administration
-- Annexe Sociale
('ens-002', 'grp-001'), -- Services Citoyens
('ens-002', 'grp-003'), -- Archives
-- Campus de la Doua
('ens-003', 'grp-004'), -- Laboratoires Chimie
('ens-003', 'grp-005'), -- Amphithéâtres
('ens-003', 'grp-006'), -- Bibliothèques
-- Campus Rockefeller
('ens-004', 'grp-006'), -- Bibliothèques
-- Gare Part-Dieu
('ens-005', 'grp-007'), -- Quais Voyageurs
-- Centre de Maintenance
('ens-006', 'grp-008'), -- Ateliers Maintenance
-- Bâtiment Principal Hôpital
('ens-007', 'grp-010'), -- Chambres Patients
-- Pavillon Urgences
('ens-008', 'grp-009'); -- Services Urgences

-- 7. Relations groupes-éléments
INSERT INTO location_group_elements (group_id, element_id) VALUES
-- Services Citoyens
('grp-001', 'elem-001'), -- Guichet État Civil
-- Administration
('grp-002', 'elem-002'), -- Bureau du Maire
('grp-002', 'elem-003'), -- Salle du Conseil
-- Archives
('grp-003', 'elem-004'), -- Archive Historique
-- Laboratoires Chimie
('grp-004', 'elem-005'), -- Labo Chimie Organique
-- Amphithéâtres
('grp-005', 'elem-006'), -- Amphi Pasteur
-- Bibliothèques
('grp-006', 'elem-007'), -- Bibliothèque Sciences
-- Quais Voyageurs
('grp-007', 'elem-008'), -- Quai A
-- Ateliers Maintenance
('grp-008', 'elem-009'), -- Atelier Bogies
('grp-008', 'elem-010'), -- Poste d'Aiguillage
-- Services Urgences
('grp-009', 'elem-011'), -- Box Urgences 1
-- Chambres Patients
('grp-010', 'elem-012'), -- Bloc Opératoire 3
('grp-010', 'elem-013'); -- Chambre 205

-- 8. Tags sur les ensembles
INSERT INTO location_ensemble_tags (ensemble_id, tag_id) VALUES
('ens-001', 'tag-001'), -- Hôtel de Ville - Accueil Public
('ens-001', 'tag-003'), -- Hôtel de Ville - Accessible PMR
('ens-002', 'tag-001'), -- Annexe Sociale - Accueil Public
('ens-002', 'tag-004'), -- Annexe Sociale - Archive
('ens-003', 'tag-005'), -- Campus Doua - Laboratoire
('ens-003', 'tag-006'), -- Campus Doua - Amphithéâtre
('ens-004', 'tag-007'), -- Campus Rockefeller - Bibliothèque
('ens-005', 'tag-008'), -- Gare Part-Dieu - Zone Critique
('ens-006', 'tag-009'), -- Centre Maintenance - Maintenance
('ens-007', 'tag-010'), -- Bâtiment Principal Hôpital - Stérile
('ens-008', 'tag-011'); -- Pavillon Urgences - Urgences

-- 9. Tags sur les groupes
INSERT INTO location_group_tags (group_id, tag_id) VALUES
('grp-001', 'tag-001'), -- Services Citoyens - Accueil Public
('grp-002', 'tag-002'), -- Administration - Sécurisé
('grp-003', 'tag-004'), -- Archives - Archive
('grp-004', 'tag-005'), -- Laboratoires Chimie - Laboratoire
('grp-005', 'tag-006'), -- Amphithéâtres - Amphithéâtre
('grp-006', 'tag-007'), -- Bibliothèques - Bibliothèque
('grp-007', 'tag-008'), -- Quais Voyageurs - Zone Critique
('grp-008', 'tag-009'), -- Ateliers Maintenance - Maintenance
('grp-009', 'tag-011'), -- Services Urgences - Urgences
('grp-010', 'tag-010'); -- Chambres Patients - Stérile

-- 10. Tags sur les éléments
INSERT INTO location_element_tags (element_id, tag_id) VALUES
('elem-001', 'tag-001'), -- Guichet État Civil - Accueil Public
('elem-001', 'tag-003'), -- Guichet État Civil - Accessible PMR
('elem-002', 'tag-002'), -- Bureau du Maire - Sécurisé
('elem-003', 'tag-002'), -- Salle du Conseil - Sécurisé
('elem-004', 'tag-004'), -- Archive Historique - Archive
('elem-005', 'tag-005'), -- Labo Chimie Organique - Laboratoire
('elem-006', 'tag-006'), -- Amphi Pasteur - Amphithéâtre
('elem-006', 'tag-003'), -- Amphi Pasteur - Accessible PMR
('elem-007', 'tag-007'), -- Bibliothèque Sciences - Bibliothèque
('elem-008', 'tag-008'), -- Quai A - Zone Critique
('elem-009', 'tag-009'), -- Atelier Bogies - Maintenance
('elem-010', 'tag-008'), -- Poste d'Aiguillage - Zone Critique
('elem-011', 'tag-011'), -- Box Urgences 1 - Urgences
('elem-012', 'tag-010'), -- Bloc Opératoire 3 - Stérile
('elem-013', 'tag-010'); -- Chambre 205 - Stérile
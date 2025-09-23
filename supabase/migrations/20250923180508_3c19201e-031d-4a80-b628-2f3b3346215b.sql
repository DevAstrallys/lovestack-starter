-- Création de données de test pour toutes les organisations

-- 1. Création des tags par organisation
INSERT INTO location_tags (organization_id, name, color) VALUES
-- Centre Commercial Atlantis
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'Boutique', '#f59e0b'),
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'Restaurant', '#ef4444'),
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'Service', '#10b981'),
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'Parking', '#6b7280'),

-- Copropriété Bella Vista
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Appartement', '#3b82f6'),
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Terrasse', '#14b8a6'),
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Vue Mer', '#06b6d4'),
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Parking Privé', '#8b5cf6'),

-- Immeuble Central Plaza  
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Bureau', '#0ea5e9'),
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Salle Réunion', '#f97316'),
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Open Space', '#84cc16'),
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Direction', '#ec4899'),

-- Immeuble Les Terrasses
('4187309c-8265-45b6-b4f2-7e5d0c7df1e0', 'Terrasse Verte', '#22c55e'),
('4187309c-8265-45b6-b4f2-7e5d0c7df1e0', 'Bureau Premium', '#a855f7'),
('4187309c-8265-45b6-b4f2-7e5d0c7df1e0', 'Espace Détente', '#f59e0b'),

-- Résidence du Parc
('4a93826f-da2a-4d27-9e87-55247bc1bebd', 'Maison', '#ef4444'),
('4a93826f-da2a-4d27-9e87-55247bc1bebd', 'Jardin', '#10b981'),
('4a93826f-da2a-4d27-9e87-55247bc1bebd', 'Garage', '#6b7280'),

-- Résidence Les Jardins
('4c241cb8-bc91-4d9d-b737-58bb7d525479', 'Logement', '#3b82f6'),
('4c241cb8-bc91-4d9d-b737-58bb7d525479', 'Balcon', '#14b8a6'),
('4c241cb8-bc91-4d9d-b737-58bb7d525479', 'Cave', '#8b5cf6'),

-- Résidence Universitaire Voltaire
('e4d1d994-c4cc-4939-a00c-12f5c7da1418', 'Chambre', '#0ea5e9'),
('e4d1d994-c4cc-4939-a00c-12f5c7da1418', 'Salle Commune', '#f97316'),
('e4d1d994-c4cc-4939-a00c-12f5c7da1418', 'Cuisine Partagée', '#84cc16');

-- 2. Création des éléments par organisation
INSERT INTO location_elements (organization_id, name, description, location_data) VALUES
-- Centre Commercial Atlantis
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'Boutique Zara', 'Magasin de prêt-à-porter niveau 1', '{"level": 1, "surface": 250}'),
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'McDonald''s', 'Restaurant fast-food aire de restauration', '{"level": 2, "surface": 180}'),
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'Carrefour Market', 'Supermarché niveau -1', '{"level": -1, "surface": 800}'),
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'Parking P1', 'Parking souterrain niveau -1', '{"level": -1, "places": 350}'),

-- Copropriété Bella Vista
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Appartement 101', 'T3 avec terrasse vue mer', '{"floor": 1, "rooms": 3, "surface": 85}'),
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Appartement 201', 'T4 duplex avec grande terrasse', '{"floor": 2, "rooms": 4, "surface": 120}'),
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Appartement 301', 'Penthouse vue panoramique', '{"floor": 3, "rooms": 5, "surface": 180}'),
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Parking Box 15', 'Box fermé sous-sol', '{"level": -1, "type": "box"}'),

-- Immeuble Central Plaza
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Bureau 205', 'Bureau individuel 2ème étage', '{"floor": 2, "surface": 25}'),
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Salle Réunion A', 'Salle 12 personnes avec vidéoprojecteur', '{"floor": 1, "capacity": 12}'),
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Open Space Nord', 'Plateau de 20 postes étage 3', '{"floor": 3, "workstations": 20}'),
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Bureau Direction', 'Suite direction 8ème étage', '{"floor": 8, "surface": 60}'),

-- Immeuble Les Terrasses
('4187309c-8265-45b6-b4f2-7e5d0c7df1e0', 'Terrasse Sud', 'Terrasse végétalisée 150m²', '{"level": 4, "surface": 150, "type": "garden"}'),
('4187309c-8265-45b6-b4f2-7e5d0c7df1e0', 'Bureau 401', 'Bureau premium avec terrasse privée', '{"floor": 4, "surface": 45}'),
('4187309c-8265-45b6-b4f2-7e5d0c7df1e0', 'Espace Zen', 'Zone de détente 2ème étage', '{"floor": 2, "surface": 80}'),

-- Résidence du Parc
('4a93826f-da2a-4d27-9e87-55247bc1bebd', 'Maison A1', 'Villa 4 chambres avec jardin 300m²', '{"type": "house", "rooms": 5, "garden": 300}'),
('4a93826f-da2a-4d27-9e87-55247bc1bebd', 'Maison B3', 'Maison mitoyenne 3 chambres', '{"type": "townhouse", "rooms": 4, "garden": 150}'),
('4a93826f-da2a-4d27-9e87-55247bc1bebd', 'Garage Collectif', 'Garage 20 places résidents', '{"type": "shared", "places": 20}'),

-- Résidence Les Jardins
('4c241cb8-bc91-4d9d-b737-58bb7d525479', 'Logement T2-01', 'T2 45m² avec balcon', '{"floor": 0, "rooms": 2, "surface": 45}'),
('4c241cb8-bc91-4d9d-b737-58bb7d525479', 'Logement T3-15', 'T3 65m² étage élevé', '{"floor": 5, "rooms": 3, "surface": 65}'),
('4c241cb8-bc91-4d9d-b737-58bb7d525479', 'Cave C-12', 'Cave 8m² sous-sol', '{"level": -1, "surface": 8}'),

-- Résidence Universitaire Voltaire
('e4d1d994-c4cc-4939-a00c-12f5c7da1418', 'Chambre 101', 'Studio étudiant 18m²', '{"floor": 1, "surface": 18, "furnished": true}'),
('e4d1d994-c4cc-4939-a00c-12f5c7da1418', 'Chambre 205', 'Studio étudiant avec kitchenette', '{"floor": 2, "surface": 22, "furnished": true}'),
('e4d1d994-c4cc-4939-a00c-12f5c7da1418', 'Salle Commune RDC', 'Espace détente 60m²', '{"floor": 0, "surface": 60}'),
('e4d1d994-c4cc-4939-a00c-12f5c7da1418', 'Cuisine Étage 2', 'Cuisine partagée équipée', '{"floor": 2, "surface": 25}');

-- 3. Création des groupements
INSERT INTO location_groups (organization_id, name, description) VALUES
-- Centre Commercial Atlantis
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'Zone Mode', 'Regroupement des boutiques de mode'),
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'Aire Restauration', 'Zone dédiée à la restauration'),
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'Services Pratiques', 'Banques, assurances, services'),

-- Copropriété Bella Vista  
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Bâtiment A', 'Appartements vue mer'),
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Bâtiment B', 'Appartements vue ville'),
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Parkings Privés', 'Ensemble des places privatives'),

-- Immeuble Central Plaza
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Bureaux Individuels', 'Bureaux fermés location longue durée'),
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Espaces Partagés', 'Salles de réunion et espaces communs'),
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Direction Générale', 'Étages de direction'),

-- Immeuble Les Terrasses
('4187309c-8265-45b6-b4f2-7e5d0c7df1e0', 'Espaces Verts', 'Terrasses et jardins'),
('4187309c-8265-45b6-b4f2-7e5d0c7df1e0', 'Bureaux Premium', 'Bureaux haut de gamme'),

-- Résidence du Parc
('4a93826f-da2a-4d27-9e87-55247bc1bebd', 'Villas Individuelles', 'Maisons avec jardin privatif'),
('4a93826f-da2a-4d27-9e87-55247bc1bebd', 'Maisons Mitoyennes', 'Logements accolés'),

-- Résidence Les Jardins
('4c241cb8-bc91-4d9d-b737-58bb7d525479', 'Bâtiment Nord', 'Logements exposition nord'),
('4c241cb8-bc91-4d9d-b737-58bb7d525479', 'Bâtiment Sud', 'Logements exposition sud'),

-- Résidence Universitaire Voltaire
('e4d1d994-c4cc-4939-a00c-12f5c7da1418', 'Chambres Étudiantes', 'Studios individuels'),
('e4d1d994-c4cc-4939-a00c-12f5c7da1418', 'Espaces Communs', 'Zones partagées et de convivialité');

-- 4. Création des ensembles
INSERT INTO location_ensembles (organization_id, name, description) VALUES
-- Centre Commercial Atlantis
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'Centre Commercial Complet', 'Ensemble de tous les espaces commerciaux'),
('6dc5f612-184c-4c19-82f7-c9746ae922b7', 'Zone Commerciale Premium', 'Boutiques et restaurants haut de gamme'),

-- Copropriété Bella Vista
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Résidence Complète', 'Tous les bâtiments et parkings'),
('2b66e735-a7bf-4295-8e35-f7d7641ca269', 'Vue Mer Premium', 'Appartements avec vue mer exceptionnelle'),

-- Immeuble Central Plaza
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Tour Complète', 'Ensemble de tous les étages'),
('f05dbef4-0908-454d-ad89-020d471df3f4', 'Espaces Exécutifs', 'Bureaux et salles haut standing'),

-- Immeuble Les Terrasses
('4187309c-8265-45b6-b4f2-7e5d0c7df1e0', 'Immeuble Écologique', 'Bureaux avec espaces verts'),

-- Résidence du Parc
('4a93826f-da2a-4d27-9e87-55247bc1bebd', 'Ensemble Résidentiel', 'Toutes les habitations du parc'),

-- Résidence Les Jardins
('4c241cb8-bc91-4d9d-b737-58bb7d525479', 'Résidence Complète', 'Tous logements et annexes'),

-- Résidence Universitaire Voltaire
('e4d1d994-c4cc-4939-a00c-12f5c7da1418', 'Campus Étudiant', 'Ensemble des logements étudiants');
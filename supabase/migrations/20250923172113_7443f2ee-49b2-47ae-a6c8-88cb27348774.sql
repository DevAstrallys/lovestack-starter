-- Add comprehensive test data for location management

-- 1. Location tags (for Tags tab)
INSERT INTO public.location_tags (organization_id, name, color) 
SELECT o.id, 'Urgent', '#ef4444' FROM organizations o WHERE o.name = 'Résidence Les Jardins'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_tags (organization_id, name, color) 
SELECT o.id, 'Maintenance', '#f97316' FROM organizations o WHERE o.name = 'Résidence Les Jardins'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_tags (organization_id, name, color) 
SELECT o.id, 'Sécurité', '#eab308' FROM organizations o WHERE o.name = 'Résidence Les Jardins'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_tags (organization_id, name, color) 
SELECT o.id, 'Nettoyage', '#16a34a' FROM organizations o WHERE o.name = 'Résidence Les Jardins'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_tags (organization_id, name, color) 
SELECT o.id, 'Priorité haute', '#dc2626' FROM organizations o WHERE o.name = 'Immeuble Central Plaza'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_tags (organization_id, name, color) 
SELECT o.id, 'Travaux', '#9333ea' FROM organizations o WHERE o.name = 'Immeuble Central Plaza'
ON CONFLICT DO NOTHING;

-- 2. Location ensembles (for Ensembles tab)
INSERT INTO public.location_ensembles (organization_id, name, description) 
SELECT o.id, 'Bâtiment A', 'Bâtiment principal résidentiel avec 50 logements'
FROM organizations o WHERE o.name = 'Résidence Les Jardins'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_ensembles (organization_id, name, description) 
SELECT o.id, 'Bâtiment B', 'Bâtiment secondaire avec commerces au rez-de-chaussée'
FROM organizations o WHERE o.name = 'Résidence Les Jardins'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_ensembles (organization_id, name, description) 
SELECT o.id, 'Tour Nord', 'Tour de bureaux de 20 étages côté nord'
FROM organizations o WHERE o.name = 'Immeuble Central Plaza'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_ensembles (organization_id, name, description) 
SELECT o.id, 'Tour Sud', 'Tour résidentielle de 15 étages côté sud'
FROM organizations o WHERE o.name = 'Immeuble Central Plaza'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_ensembles (organization_id, name, description) 
SELECT o.id, 'Villa Marina Est', 'Bâtiment principal avec vue mer'
FROM organizations o WHERE o.name = 'Résidence Villa Marina'
ON CONFLICT DO NOTHING;

-- 3. Location groups (for Groupements tab)
INSERT INTO public.location_groups (organization_id, name, description) 
SELECT o.id, 'Étage 1 - Bât A', 'Premier étage du Bâtiment A - 8 appartements'
FROM organizations o WHERE o.name = 'Résidence Les Jardins'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_groups (organization_id, name, description) 
SELECT o.id, 'Étage 2 - Bât A', 'Deuxième étage du Bâtiment A - 8 appartements'
FROM organizations o WHERE o.name = 'Résidence Les Jardins'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_groups (organization_id, name, description) 
SELECT o.id, 'RDC Commercial', 'Rez-de-chaussée avec commerces et services'
FROM organizations o WHERE o.name = 'Résidence Les Jardins'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_groups (organization_id, name, description) 
SELECT o.id, 'Étages 10-15 Tour Nord', 'Bureaux du 10ème au 15ème étage'
FROM organizations o WHERE o.name = 'Immeuble Central Plaza'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_groups (organization_id, name, description) 
SELECT o.id, 'Étages 1-5 Tour Sud', 'Appartements du 1er au 5ème étage'
FROM organizations o WHERE o.name = 'Immeuble Central Plaza'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_groups (organization_id, name, description) 
SELECT o.id, 'Étages 6-10 Tour Sud', 'Appartements du 6ème au 10ème étage'
FROM organizations o WHERE o.name = 'Immeuble Central Plaza'
ON CONFLICT DO NOTHING;

-- 4. Location elements (for Éléments tab)
INSERT INTO public.location_elements (organization_id, parent_id, name, description, location_data) 
SELECT 
    o.id, 
    lg.id,
    'Appartement 101', 
    'Appartement 3 pièces avec balcon', 
    '{"type": "apartment", "surface": 75, "rooms": 3, "balcony": true}'
FROM organizations o 
JOIN location_groups lg ON lg.organization_id = o.id
WHERE o.name = 'Résidence Les Jardins' AND lg.name = 'Étage 1 - Bât A'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_elements (organization_id, parent_id, name, description, location_data) 
SELECT 
    o.id, 
    lg.id,
    'Appartement 102', 
    'Appartement 2 pièces avec vue jardin', 
    '{"type": "apartment", "surface": 55, "rooms": 2, "garden_view": true}'
FROM organizations o 
JOIN location_groups lg ON lg.organization_id = o.id
WHERE o.name = 'Résidence Les Jardins' AND lg.name = 'Étage 1 - Bât A'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_elements (organization_id, parent_id, name, description, location_data) 
SELECT 
    o.id, 
    lg.id,
    'Appartement 103', 
    'Appartement 4 pièces d''angle', 
    '{"type": "apartment", "surface": 95, "rooms": 4, "corner": true}'
FROM organizations o 
JOIN location_groups lg ON lg.organization_id = o.id
WHERE o.name = 'Résidence Les Jardins' AND lg.name = 'Étage 1 - Bât A'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_elements (organization_id, parent_id, name, description, location_data) 
SELECT 
    o.id, 
    lg.id,
    'Appartement 201', 
    'Appartement 3 pièces avec terrasse', 
    '{"type": "apartment", "surface": 78, "rooms": 3, "terrace": true}'
FROM organizations o 
JOIN location_groups lg ON lg.organization_id = o.id
WHERE o.name = 'Résidence Les Jardins' AND lg.name = 'Étage 2 - Bât A'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_elements (organization_id, parent_id, name, description, location_data) 
SELECT 
    o.id, 
    lg.id,
    'Appartement 202', 
    'Appartement 2 pièces moderne', 
    '{"type": "apartment", "surface": 52, "rooms": 2, "modern": true}'
FROM organizations o 
JOIN location_groups lg ON lg.organization_id = o.id
WHERE o.name = 'Résidence Les Jardins' AND lg.name = 'Étage 2 - Bât A'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_elements (organization_id, parent_id, name, description, location_data) 
SELECT 
    o.id, 
    lg.id,
    'Boulangerie Le Petit Matin', 
    'Boulangerie-pâtisserie traditionnelle', 
    '{"type": "commercial", "activity": "bakery", "opening_hours": "6h-19h"}'
FROM organizations o 
JOIN location_groups lg ON lg.organization_id = o.id
WHERE o.name = 'Résidence Les Jardins' AND lg.name = 'RDC Commercial'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_elements (organization_id, parent_id, name, description, location_data) 
SELECT 
    o.id, 
    lg.id,
    'Pharmacie du Centre', 
    'Pharmacie avec service de garde', 
    '{"type": "commercial", "activity": "pharmacy", "guard_service": true}'
FROM organizations o 
JOIN location_groups lg ON lg.organization_id = o.id
WHERE o.name = 'Résidence Les Jardins' AND lg.name = 'RDC Commercial'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_elements (organization_id, parent_id, name, description, location_data) 
SELECT 
    o.id, 
    lg.id,
    'Bureau Direction 1001', 
    'Bureau de direction avec salle de réunion', 
    '{"type": "office", "surface": 120, "meeting_room": true}'
FROM organizations o 
JOIN location_groups lg ON lg.organization_id = o.id
WHERE o.name = 'Immeuble Central Plaza' AND lg.name = 'Étages 10-15 Tour Nord'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_elements (organization_id, parent_id, name, description, location_data) 
SELECT 
    o.id, 
    lg.id,
    'Open Space 1002', 
    'Espace de travail collaboratif pour 20 personnes', 
    '{"type": "office", "surface": 200, "capacity": 20, "open_space": true}'
FROM organizations o 
JOIN location_groups lg ON lg.organization_id = o.id
WHERE o.name = 'Immeuble Central Plaza' AND lg.name = 'Étages 10-15 Tour Nord'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_elements (organization_id, parent_id, name, description, location_data) 
SELECT 
    o.id, 
    lg.id,
    'Appartement 301', 
    'Appartement de standing avec vue panoramique', 
    '{"type": "apartment", "surface": 110, "rooms": 4, "panoramic_view": true}'
FROM organizations o 
JOIN location_groups lg ON lg.organization_id = o.id
WHERE o.name = 'Immeuble Central Plaza' AND lg.name = 'Étages 1-5 Tour Sud'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_elements (organization_id, parent_id, name, description, location_data) 
SELECT 
    o.id, 
    lg.id,
    'Appartement 302', 
    'Appartement familial avec 2 salles de bains', 
    '{"type": "apartment", "surface": 95, "rooms": 4, "bathrooms": 2}'
FROM organizations o 
JOIN location_groups lg ON lg.organization_id = o.id
WHERE o.name = 'Immeuble Central Plaza' AND lg.name = 'Étages 1-5 Tour Sud'
ON CONFLICT DO NOTHING;

-- 5. Associate elements with tags
INSERT INTO public.location_element_tags (element_id, tag_id)
SELECT le.id, lt.id
FROM location_elements le
JOIN organizations o ON o.id = le.organization_id
JOIN location_tags lt ON lt.organization_id = o.id
WHERE le.name = 'Appartement 101' AND lt.name = 'Urgent'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_element_tags (element_id, tag_id)
SELECT le.id, lt.id
FROM location_elements le
JOIN organizations o ON o.id = le.organization_id
JOIN location_tags lt ON lt.organization_id = o.id
WHERE le.name = 'Boulangerie Le Petit Matin' AND lt.name = 'Maintenance'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_element_tags (element_id, tag_id)
SELECT le.id, lt.id
FROM location_elements le
JOIN organizations o ON o.id = le.organization_id
JOIN location_tags lt ON lt.organization_id = o.id
WHERE le.name = 'Bureau Direction 1001' AND lt.name = 'Priorité haute'
ON CONFLICT DO NOTHING;

-- 6. Associate groups with tags
INSERT INTO public.location_group_tags (group_id, tag_id)
SELECT lg.id, lt.id
FROM location_groups lg
JOIN organizations o ON o.id = lg.organization_id
JOIN location_tags lt ON lt.organization_id = o.id
WHERE lg.name = 'Étage 1 - Bât A' AND lt.name = 'Sécurité'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_group_tags (group_id, tag_id)
SELECT lg.id, lt.id
FROM location_groups lg
JOIN organizations o ON o.id = lg.organization_id
JOIN location_tags lt ON lt.organization_id = o.id
WHERE lg.name = 'Étages 10-15 Tour Nord' AND lt.name = 'Travaux'
ON CONFLICT DO NOTHING;

-- 7. Associate ensembles with groups
INSERT INTO public.location_ensemble_groups (ensemble_id, group_id)
SELECT le.id, lg.id
FROM location_ensembles le
JOIN organizations o ON o.id = le.organization_id
JOIN location_groups lg ON lg.organization_id = o.id
WHERE le.name = 'Bâtiment A' AND lg.name LIKE 'Étage % - Bât A'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_ensemble_groups (ensemble_id, group_id)
SELECT le.id, lg.id
FROM location_ensembles le
JOIN organizations o ON o.id = le.organization_id
JOIN location_groups lg ON lg.organization_id = o.id
WHERE le.name = 'Bâtiment B' AND lg.name = 'RDC Commercial'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_ensemble_groups (ensemble_id, group_id)
SELECT le.id, lg.id
FROM location_ensembles le
JOIN organizations o ON o.id = le.organization_id
JOIN location_groups lg ON lg.organization_id = o.id
WHERE le.name = 'Tour Nord' AND lg.name = 'Étages 10-15 Tour Nord'
ON CONFLICT DO NOTHING;

INSERT INTO public.location_ensemble_groups (ensemble_id, group_id)
SELECT le.id, lg.id
FROM location_ensembles le
JOIN organizations o ON o.id = le.organization_id
JOIN location_groups lg ON lg.organization_id = o.id
WHERE le.name = 'Tour Sud' AND lg.name LIKE 'Étages % Tour Sud'
ON CONFLICT DO NOTHING;

-- 8. Associate groups with elements
INSERT INTO public.location_group_elements (group_id, element_id)
SELECT lg.id, le.id
FROM location_groups lg
JOIN location_elements le ON le.parent_id = lg.id
ON CONFLICT DO NOTHING;
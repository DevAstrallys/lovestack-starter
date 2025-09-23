-- Création des relations entre les éléments, groupes et ensembles

-- Relations tags sur les éléments (récupération des IDs nécessaires d'abord)

-- Centre Commercial Atlantis - Relations
WITH atlantis_data AS (
  SELECT 
    o.id as org_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Boutique Zara') as zara_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'McDonald''s') as mcdo_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Carrefour Market') as carrefour_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Parking P1') as parking_id,
    (SELECT id FROM location_tags WHERE organization_id = o.id AND name = 'Boutique') as boutique_tag,
    (SELECT id FROM location_tags WHERE organization_id = o.id AND name = 'Restaurant') as resto_tag,
    (SELECT id FROM location_tags WHERE organization_id = o.id AND name = 'Service') as service_tag,
    (SELECT id FROM location_tags WHERE organization_id = o.id AND name = 'Parking') as parking_tag,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Zone Mode') as mode_group,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Aire Restauration') as resto_group,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Services Pratiques') as service_group,
    (SELECT id FROM location_ensembles WHERE organization_id = o.id AND name = 'Centre Commercial Complet') as complet_ensemble,
    (SELECT id FROM location_ensembles WHERE organization_id = o.id AND name = 'Zone Commerciale Premium') as premium_ensemble
  FROM organizations o WHERE name = 'Centre Commercial Atlantis'
)
INSERT INTO location_element_tags (element_id, tag_id)
SELECT zara_id, boutique_tag FROM atlantis_data WHERE zara_id IS NOT NULL
UNION ALL
SELECT mcdo_id, resto_tag FROM atlantis_data WHERE mcdo_id IS NOT NULL  
UNION ALL
SELECT carrefour_id, service_tag FROM atlantis_data WHERE carrefour_id IS NOT NULL
UNION ALL  
SELECT parking_id, parking_tag FROM atlantis_data WHERE parking_id IS NOT NULL;

-- Relations éléments dans groupes pour Atlantis
WITH atlantis_data AS (
  SELECT 
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Boutique Zara') as zara_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'McDonald''s') as mcdo_id,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Zone Mode') as mode_group,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Aire Restauration') as resto_group
  FROM organizations o WHERE name = 'Centre Commercial Atlantis'
)
INSERT INTO location_group_elements (group_id, element_id)
SELECT mode_group, zara_id FROM atlantis_data WHERE zara_id IS NOT NULL AND mode_group IS NOT NULL
UNION ALL
SELECT resto_group, mcdo_id FROM atlantis_data WHERE mcdo_id IS NOT NULL AND resto_group IS NOT NULL;

-- Relations groupes dans ensembles pour Atlantis  
WITH atlantis_data AS (
  SELECT 
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Zone Mode') as mode_group,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Aire Restauration') as resto_group,
    (SELECT id FROM location_ensembles WHERE organization_id = o.id AND name = 'Centre Commercial Complet') as complet_ensemble
  FROM organizations o WHERE name = 'Centre Commercial Atlantis'
)
INSERT INTO location_ensemble_groups (ensemble_id, group_id)
SELECT complet_ensemble, mode_group FROM atlantis_data WHERE complet_ensemble IS NOT NULL AND mode_group IS NOT NULL
UNION ALL
SELECT complet_ensemble, resto_group FROM atlantis_data WHERE complet_ensemble IS NOT NULL AND resto_group IS NOT NULL;

-- Copropriété Bella Vista - Relations
WITH bellavista_data AS (
  SELECT 
    o.id as org_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Appartement 101') as apt101_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Appartement 201') as apt201_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Appartement 301') as apt301_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Parking Box 15') as parking_id,
    (SELECT id FROM location_tags WHERE organization_id = o.id AND name = 'Appartement') as apt_tag,
    (SELECT id FROM location_tags WHERE organization_id = o.id AND name = 'Vue Mer') as vuemer_tag,
    (SELECT id FROM location_tags WHERE organization_id = o.id AND name = 'Terrasse') as terrasse_tag,
    (SELECT id FROM location_tags WHERE organization_id = o.id AND name = 'Parking Privé') as parking_tag,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Bâtiment A') as batA_group,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Parkings Privés') as parking_group,
    (SELECT id FROM location_ensembles WHERE organization_id = o.id AND name = 'Résidence Complète') as complet_ensemble
  FROM organizations o WHERE name = 'Copropriété Bella Vista'
)
INSERT INTO location_element_tags (element_id, tag_id)
SELECT apt101_id, apt_tag FROM bellavista_data WHERE apt101_id IS NOT NULL AND apt_tag IS NOT NULL
UNION ALL
SELECT apt101_id, vuemer_tag FROM bellavista_data WHERE apt101_id IS NOT NULL AND vuemer_tag IS NOT NULL
UNION ALL
SELECT apt201_id, apt_tag FROM bellavista_data WHERE apt201_id IS NOT NULL AND apt_tag IS NOT NULL
UNION ALL
SELECT apt201_id, terrasse_tag FROM bellavista_data WHERE apt201_id IS NOT NULL AND terrasse_tag IS NOT NULL
UNION ALL
SELECT apt301_id, apt_tag FROM bellavista_data WHERE apt301_id IS NOT NULL AND apt_tag IS NOT NULL
UNION ALL
SELECT apt301_id, vuemer_tag FROM bellavista_data WHERE apt301_id IS NOT NULL AND vuemer_tag IS NOT NULL
UNION ALL
SELECT parking_id, parking_tag FROM bellavista_data WHERE parking_id IS NOT NULL AND parking_tag IS NOT NULL;

-- Relations dans groupes pour Bella Vista
WITH bellavista_data AS (
  SELECT 
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Appartement 101') as apt101_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Appartement 201') as apt201_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Parking Box 15') as parking_id,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Bâtiment A') as batA_group,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Parkings Privés') as parking_group
  FROM organizations o WHERE name = 'Copropriété Bella Vista'
)
INSERT INTO location_group_elements (group_id, element_id)
SELECT batA_group, apt101_id FROM bellavista_data WHERE batA_group IS NOT NULL AND apt101_id IS NOT NULL
UNION ALL
SELECT batA_group, apt201_id FROM bellavista_data WHERE batA_group IS NOT NULL AND apt201_id IS NOT NULL
UNION ALL
SELECT parking_group, parking_id FROM bellavista_data WHERE parking_group IS NOT NULL AND parking_id IS NOT NULL;

-- Immeuble Central Plaza - Relations  
WITH plaza_data AS (
  SELECT 
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Bureau 205') as bureau205_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Salle Réunion A') as salle_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Bureau Direction') as direction_id,
    (SELECT id FROM location_tags WHERE organization_id = o.id AND name = 'Bureau') as bureau_tag,
    (SELECT id FROM location_tags WHERE organization_id = o.id AND name = 'Salle Réunion') as salle_tag,
    (SELECT id FROM location_tags WHERE organization_id = o.id AND name = 'Direction') as direction_tag,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Bureaux Individuels') as bureau_group,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Espaces Partagés') as partage_group,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Direction Générale') as direction_group
  FROM organizations o WHERE name = 'Immeuble Central Plaza'
)
INSERT INTO location_element_tags (element_id, tag_id)
SELECT bureau205_id, bureau_tag FROM plaza_data WHERE bureau205_id IS NOT NULL AND bureau_tag IS NOT NULL
UNION ALL
SELECT salle_id, salle_tag FROM plaza_data WHERE salle_id IS NOT NULL AND salle_tag IS NOT NULL
UNION ALL
SELECT direction_id, direction_tag FROM plaza_data WHERE direction_id IS NOT NULL AND direction_tag IS NOT NULL;

-- Relations dans groupes pour Central Plaza
WITH plaza_data AS (
  SELECT 
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Bureau 205') as bureau205_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Salle Réunion A') as salle_id,
    (SELECT id FROM location_elements WHERE organization_id = o.id AND name = 'Bureau Direction') as direction_id,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Bureaux Individuels') as bureau_group,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Espaces Partagés') as partage_group,
    (SELECT id FROM location_groups WHERE organization_id = o.id AND name = 'Direction Générale') as direction_group
  FROM organizations o WHERE name = 'Immeuble Central Plaza'
)
INSERT INTO location_group_elements (group_id, element_id)
SELECT bureau_group, bureau205_id FROM plaza_data WHERE bureau_group IS NOT NULL AND bureau205_id IS NOT NULL
UNION ALL
SELECT partage_group, salle_id FROM plaza_data WHERE partage_group IS NOT NULL AND salle_id IS NOT NULL
UNION ALL
SELECT direction_group, direction_id FROM plaza_data WHERE direction_group IS NOT NULL AND direction_id IS NOT NULL;
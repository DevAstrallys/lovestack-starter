-- Créer une dizaine d'éléments par organisation avec des groupes et ensembles

-- Fonction pour créer des éléments et leurs relations
DO $$
DECLARE
  org_record RECORD;
  element_id_1 uuid;
  element_id_2 uuid;
  element_id_3 uuid;
  element_id_4 uuid;
  element_id_5 uuid;
  element_id_6 uuid;
  element_id_7 uuid;
  element_id_8 uuid;
  element_id_9 uuid;
  element_id_10 uuid;
  group_accueil_id uuid;
  group_technique_id uuid;
  group_exterieur_id uuid;
  ensemble_complet_id uuid;
  tag_principal_id uuid;
  tag_securite_id uuid;
  tag_exterieur_id uuid;
BEGIN
  -- Pour chaque organisation
  FOR org_record IN SELECT id, name FROM organizations LOOP
    
    -- Créer les tags spécifiques
    INSERT INTO location_tags (organization_id, name, color) VALUES
    (org_record.id, 'Principal', '#3b82f6') RETURNING id INTO tag_principal_id;
    
    INSERT INTO location_tags (organization_id, name, color) VALUES
    (org_record.id, 'Sécurité', '#ef4444') RETURNING id INTO tag_securite_id;
    
    INSERT INTO location_tags (organization_id, name, color) VALUES
    (org_record.id, 'Extérieur', '#22c55e') RETURNING id INTO tag_exterieur_id;

    -- Créer 10 éléments de localisation
    INSERT INTO location_elements (organization_id, name, description, location_data) VALUES
    (org_record.id, 'Hall d''Entrée Principal', 'Zone d''accueil et de réception des visiteurs', '{"type": "entrance", "floor": 0, "area": 120}') RETURNING id INTO element_id_1;
    
    INSERT INTO location_elements (organization_id, name, description, location_data) VALUES
    (org_record.id, 'Accueil / Réception', 'Bureau d''accueil avec système d''information', '{"type": "reception", "floor": 0, "area": 25}') RETURNING id INTO element_id_2;
    
    INSERT INTO location_elements (organization_id, name, description, location_data) VALUES
    (org_record.id, 'Salle d''Attente', 'Espace d''attente avec mobilier confortable', '{"type": "waiting", "floor": 0, "area": 40}') RETURNING id INTO element_id_3;
    
    INSERT INTO location_elements (organization_id, name, description, location_data) VALUES
    (org_record.id, 'Local Technique Principal', 'Salle des machines et équipements techniques', '{"type": "technical", "floor": -1, "area": 80}') RETURNING id INTO element_id_4;
    
    INSERT INTO location_elements (organization_id, name, description, location_data) VALUES
    (org_record.id, 'Chaufferie', 'Local chauffage et production d''eau chaude', '{"type": "heating", "floor": -1, "area": 35}') RETURNING id INTO element_id_5;
    
    INSERT INTO location_elements (organization_id, name, description, location_data) VALUES
    (org_record.id, 'Local Électrique', 'Tableau électrique général et compteurs', '{"type": "electrical", "floor": -1, "area": 20}') RETURNING id INTO element_id_6;
    
    INSERT INTO location_elements (organization_id, name, description, location_data) VALUES
    (org_record.id, 'Parking Principal', 'Zone de stationnement véhicules', '{"type": "parking", "floor": 0, "area": 500}') RETURNING id INTO element_id_7;
    
    INSERT INTO location_elements (organization_id, name, description, location_data) VALUES
    (org_record.id, 'Jardin / Espaces Verts', 'Aménagements paysagers et espaces extérieurs', '{"type": "garden", "floor": 0, "area": 300}') RETURNING id INTO element_id_8;
    
    INSERT INTO location_elements (organization_id, name, description, location_data) VALUES
    (org_record.id, 'Zone de Livraison', 'Accès pour véhicules de livraison et service', '{"type": "delivery", "floor": 0, "area": 60}') RETURNING id INTO element_id_9;
    
    INSERT INTO location_elements (organization_id, name, description, location_data) VALUES
    (org_record.id, 'Local Poubelles', 'Zone de stockage des déchets et recyclage', '{"type": "waste", "floor": 0, "area": 25}') RETURNING id INTO element_id_10;

    -- Créer 3 groupes logiques
    INSERT INTO location_groups (organization_id, name, description) VALUES
    (org_record.id, 'Accueil et Réception', 'Espaces d''accueil du public et visiteurs') RETURNING id INTO group_accueil_id;
    
    INSERT INTO location_groups (organization_id, name, description) VALUES
    (org_record.id, 'Locaux Techniques', 'Espaces techniques et maintenance') RETURNING id INTO group_technique_id;
    
    INSERT INTO location_groups (organization_id, name, description) VALUES
    (org_record.id, 'Espaces Extérieurs', 'Zones extérieures et services') RETURNING id INTO group_exterieur_id;

    -- Associer les éléments aux groupes
    -- Groupe Accueil
    INSERT INTO location_group_elements (group_id, element_id) VALUES
    (group_accueil_id, element_id_1),
    (group_accueil_id, element_id_2),
    (group_accueil_id, element_id_3);
    
    -- Groupe Technique
    INSERT INTO location_group_elements (group_id, element_id) VALUES
    (group_technique_id, element_id_4),
    (group_technique_id, element_id_5),
    (group_technique_id, element_id_6);
    
    -- Groupe Extérieur
    INSERT INTO location_group_elements (group_id, element_id) VALUES
    (group_exterieur_id, element_id_7),
    (group_exterieur_id, element_id_8),
    (group_exterieur_id, element_id_9),
    (group_exterieur_id, element_id_10);

    -- Créer un ensemble complet pour l'organisation
    INSERT INTO location_ensembles (organization_id, name, description) VALUES
    (org_record.id, 'Ensemble Complet - ' || org_record.name, 'Ensemble regroupant tous les espaces de ' || org_record.name) RETURNING id INTO ensemble_complet_id;

    -- Associer tous les groupes à l'ensemble
    INSERT INTO location_ensemble_groups (ensemble_id, group_id) VALUES
    (ensemble_complet_id, group_accueil_id),
    (ensemble_complet_id, group_technique_id),
    (ensemble_complet_id, group_exterieur_id);

    -- Associer les tags aux éléments
    -- Tags Principal pour les éléments d'accueil
    INSERT INTO location_element_tags (element_id, tag_id) VALUES
    (element_id_1, tag_principal_id),
    (element_id_2, tag_principal_id),
    (element_id_3, tag_principal_id);
    
    -- Tags Sécurité pour les locaux techniques
    INSERT INTO location_element_tags (element_id, tag_id) VALUES
    (element_id_4, tag_securite_id),
    (element_id_5, tag_securite_id),
    (element_id_6, tag_securite_id);
    
    -- Tags Extérieur pour les espaces extérieurs
    INSERT INTO location_element_tags (element_id, tag_id) VALUES
    (element_id_7, tag_exterieur_id),
    (element_id_8, tag_exterieur_id),
    (element_id_9, tag_exterieur_id),
    (element_id_10, tag_exterieur_id);

    -- Associer les tags aux groupes
    INSERT INTO location_group_tags (group_id, tag_id) VALUES
    (group_accueil_id, tag_principal_id),
    (group_technique_id, tag_securite_id),
    (group_exterieur_id, tag_exterieur_id);

    -- Associer les tags à l'ensemble
    INSERT INTO location_ensemble_tags (ensemble_id, tag_id) VALUES
    (ensemble_complet_id, tag_principal_id),
    (ensemble_complet_id, tag_securite_id),
    (ensemble_complet_id, tag_exterieur_id);

    RAISE NOTICE 'Données créées pour l''organisation: %', org_record.name;
    
  END LOOP;
END $$;
-- ============================================================
-- SEED DATA - TAXONOMIE COMPLÈTE SELON VOTRE CAHIER DES CHARGES
-- ============================================================

-- 1) Insertion des actions principales
INSERT INTO tax_actions (label, key) VALUES 
  ('Je signale', 'signale'),
  ('Je demande', 'demande'),
  ('J''informe', 'informe')
ON CONFLICT (key) DO NOTHING;

-- 2) Récupération des IDs des actions pour les références
DO $$
DECLARE
  signale_id uuid;
  demande_id uuid;
  informe_id uuid;
BEGIN
  SELECT id INTO signale_id FROM tax_actions WHERE key = 'signale';
  SELECT id INTO demande_id FROM tax_actions WHERE key = 'demande';
  SELECT id INTO informe_id FROM tax_actions WHERE key = 'informe';

  -- 3) Catégories pour "Je signale"
  INSERT INTO tax_categories (action_id, label, key) VALUES 
    (signale_id, 'Nuisance', 'nuisance'),
    (signale_id, 'Sinistre', 'sinistre'),
    (signale_id, 'Sécurité', 'securite'),
    (signale_id, 'Vandalisme', 'vandalisme'),
    (signale_id, 'Dégradation', 'degradation'),
    (signale_id, 'Equipements', 'equipements'),
    (signale_id, 'Réseau informatique', 'reseau_informatique'),
    (signale_id, 'Equipements urbains', 'equipements_urbains')
  ON CONFLICT DO NOTHING;

  -- 4) Catégories pour "Je demande"
  INSERT INTO tax_categories (action_id, label, key) VALUES 
    (demande_id, 'Comptable', 'comptable'),
    (demande_id, 'Administrative', 'administrative'),
    (demande_id, 'Juridique', 'juridique'),
    (demande_id, 'Contentieux', 'contentieux'),
    (demande_id, 'Technique', 'technique')
  ON CONFLICT DO NOTHING;

  -- 5) Catégories pour "J'informe"
  INSERT INTO tax_categories (action_id, label, key) VALUES 
    (informe_id, 'Travaux prévus', 'travaux_prevus'),
    (informe_id, 'Événement', 'evenement'),
    (informe_id, 'Sécurité / Prévention', 'securite_prevention'),
    (informe_id, 'Présence', 'presence'),
    (informe_id, 'Autre', 'autre')
  ON CONFLICT DO NOTHING;
END $$;

-- 6) Objets pour chaque catégorie
DO $$
DECLARE
  cat_id uuid;
BEGIN
  -- Objets pour Nuisance
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'nuisance';
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Olfactive', 'olfactive'),
      (cat_id, 'Sonore', 'sonore'),
      (cat_id, 'Visuelle', 'visuelle'),
      (cat_id, 'Environnementale', 'environnementale'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Objets pour Sinistre
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'sinistre';
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Incendie', 'incendie'),
      (cat_id, 'Dégât des eaux', 'degat_eaux'),
      (cat_id, 'Explosion', 'explosion'),
      (cat_id, 'Vol', 'vol'),
      (cat_id, 'Bris de glace', 'bris_glace'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Objets pour Sécurité
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'securite';
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Des personnes', 'personnes'),
      (cat_id, 'Des biens', 'biens'),
      (cat_id, 'De l''immeuble', 'immeuble'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Objets pour Vandalisme
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'vandalisme';
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Graffitis', 'graffitis'),
      (cat_id, 'Sabotage', 'sabotage'),
      (cat_id, 'Dégradation', 'degradation'),
      (cat_id, 'Destruction', 'destruction'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Objets pour Dégradation
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'degradation';
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Fissure', 'fissure'),
      (cat_id, 'Arrachement', 'arrachement'),
      (cat_id, 'Usure', 'usure'),
      (cat_id, 'Casse', 'casse'),
      (cat_id, 'Absence', 'absence'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Objets pour Equipements
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'equipements';
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Ascenseur', 'ascenseur'),
      (cat_id, 'Chauffage', 'chauffage'),
      (cat_id, 'Électricité', 'electricite'),
      (cat_id, 'Interphone', 'interphone'),
      (cat_id, 'Internet', 'internet'),
      (cat_id, 'Climatisation', 'climatisation'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Objets pour Réseau informatique
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'reseau_informatique';
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Panne', 'panne'),
      (cat_id, 'Dysfonctionnement', 'dysfonctionnement'),
      (cat_id, 'Arrêt', 'arret'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Objets pour Equipements urbains
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'equipements_urbains';
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Boîtes aux lettres', 'boites_lettres'),
      (cat_id, 'Portail', 'portail'),
      (cat_id, 'Éclairage parties communes', 'eclairage_commun'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Objets pour catégories "Je demande" (structure similaire pour toutes)
  FOR cat_id IN (SELECT id FROM tax_categories WHERE action_id IN (SELECT id FROM tax_actions WHERE key = 'demande'))
  LOOP
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Document', 'document'),
      (cat_id, 'Explication', 'explication'),
      (cat_id, 'Renseignement', 'renseignement'),
      (cat_id, 'Modification', 'modification'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Objets pour Travaux prévus
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'travaux_prevus';
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Livraison', 'livraison'),
      (cat_id, 'Déménagement', 'demenagement'),
      (cat_id, 'Intervention artisan', 'intervention_artisan'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Objets pour Événement
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'evenement';
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Réunion', 'reunion'),
      (cat_id, 'Fête', 'fete'),
      (cat_id, 'Occupation espace commun', 'occupation_espace'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Objets pour Sécurité / Prévention
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'securite_prevention';
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Personne suspecte', 'personne_suspecte'),
      (cat_id, 'Véhicule stationné', 'vehicule_stationne'),
      (cat_id, 'Objet abandonné', 'objet_abandonne'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Objets pour Présence
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'presence';
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Absence prolongée', 'absence_prolongee'),
      (cat_id, 'Location saisonnière', 'location_saisonniere'),
      (cat_id, 'Logement vacant', 'logement_vacant'),
      (cat_id, 'Autre', 'autre')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Objets pour Autre (J'informe)
  SELECT id INTO cat_id FROM tax_categories WHERE key = 'autre' AND action_id = (SELECT id FROM tax_actions WHERE key = 'informe');
  IF cat_id IS NOT NULL THEN
    INSERT INTO tax_objects (category_id, label, key) VALUES 
      (cat_id, 'Texte libre', 'texte_libre')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 7) Création d'un lieu de test
INSERT INTO locations (name, code) VALUES 
  ('Lieu de démonstration', 'DEMO001')
ON CONFLICT (code) DO NOTHING;
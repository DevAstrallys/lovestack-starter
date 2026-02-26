
-- =============================================
-- CATEGORIES pour l'axe SIGNALER
-- =============================================
INSERT INTO tax_categories (id, action_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'signaler'), 'plomberie', 'Plomberie'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'signaler'), 'electricite', 'Électricité'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'signaler'), 'ascenseur', 'Ascenseur'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'signaler'), 'parties_communes', 'Parties communes'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'signaler'), 'securite_incendie', 'Sécurité incendie'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'signaler'), 'nuisibles', 'Nuisibles'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'signaler'), 'proprete', 'Propreté'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'signaler'), 'chauffage_clim', 'Chauffage / Climatisation'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'signaler'), 'sinistre', 'Sinistre'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'signaler'), 'espaces_verts', 'Espaces verts'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'signaler'), 'parking', 'Parking');

-- =============================================
-- CATEGORIES pour l'axe DEMANDER
-- =============================================
INSERT INTO tax_categories (id, action_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'demander'), 'administratif', 'Administratif'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'demander'), 'technique', 'Intervention technique'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'demander'), 'acces_badge', 'Accès / Badge'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'demander'), 'demenagement', 'Déménagement'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'demander'), 'reservation', 'Réservation'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'demander'), 'courrier_colis', 'Courrier / Colis');

-- =============================================
-- OBJETS pour SIGNALER > Plomberie
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'plomberie'), 'fuite_eau', 'Fuite d''eau'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'plomberie'), 'canalisation_bouchee', 'Canalisation bouchée'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'plomberie'), 'robinet_defaillant', 'Robinet défaillant'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'plomberie'), 'chasse_eau', 'Chasse d''eau HS'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'plomberie'), 'ballon_eau_chaude', 'Ballon d''eau chaude');

-- =============================================
-- OBJETS pour SIGNALER > Électricité
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'electricite'), 'panne_eclairage', 'Panne d''éclairage'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'electricite'), 'prise_defectueuse', 'Prise défectueuse'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'electricite'), 'disjoncteur', 'Disjoncteur qui saute'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'electricite'), 'interphone', 'Interphone / Digicode');

-- =============================================
-- OBJETS pour SIGNALER > Ascenseur
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label, urgency_level) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'ascenseur'), 'panne_ascenseur', 'Panne ascenseur', 3),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'ascenseur'), 'personne_bloquee', 'Personne bloquée', 4),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'ascenseur'), 'bruit_anormal', 'Bruit anormal', 2),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'ascenseur'), 'porte_bloquee', 'Porte bloquée', 3);

-- =============================================
-- OBJETS pour SIGNALER > Parties communes
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'parties_communes'), 'porte_entree', 'Porte d''entrée'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'parties_communes'), 'vitre_cassee', 'Vitre cassée'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'parties_communes'), 'graffiti', 'Graffiti / Tag'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'parties_communes'), 'boite_lettres', 'Boîte aux lettres'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'parties_communes'), 'revêtement_sol', 'Revêtement de sol');

-- =============================================
-- OBJETS pour SIGNALER > Sécurité incendie
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label, urgency_level) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'securite_incendie'), 'extincteur', 'Extincteur manquant/périmé', 3),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'securite_incendie'), 'alarme_incendie', 'Alarme incendie', 4),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'securite_incendie'), 'issue_secours', 'Issue de secours bloquée', 4),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'securite_incendie'), 'detecteur_fumee', 'Détecteur de fumée HS', 3);

-- =============================================
-- OBJETS pour SIGNALER > Nuisibles
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'nuisibles'), 'cafards', 'Cafards / Blattes'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'nuisibles'), 'rongeurs', 'Rongeurs'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'nuisibles'), 'punaises', 'Punaises de lit'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'nuisibles'), 'pigeons', 'Pigeons');

-- =============================================
-- OBJETS pour SIGNALER > Propreté
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'proprete'), 'encombrants', 'Encombrants'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'proprete'), 'poubelles', 'Poubelles / Local déchets'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'proprete'), 'salissure', 'Salissure parties communes');

-- =============================================
-- OBJETS pour SIGNALER > Chauffage / Clim
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'chauffage_clim'), 'radiateur_hs', 'Radiateur HS'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'chauffage_clim'), 'chaudiere', 'Chaudière en panne'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'chauffage_clim'), 'clim_panne', 'Climatisation en panne'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'chauffage_clim'), 'thermostat', 'Thermostat défaillant');

-- =============================================
-- OBJETS pour SIGNALER > Sinistre
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label, urgency_level) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'sinistre'), 'degat_eaux', 'Dégât des eaux', 4),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'sinistre'), 'incendie', 'Incendie', 4),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'sinistre'), 'effondrement', 'Effondrement / Fissure', 4),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'sinistre'), 'inondation', 'Inondation', 4);

-- =============================================
-- OBJETS pour SIGNALER > Espaces verts
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'espaces_verts'), 'arbre_dangereux', 'Arbre dangereux'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'espaces_verts'), 'entretien_jardin', 'Entretien jardin'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'espaces_verts'), 'aire_jeux', 'Aire de jeux abîmée');

-- =============================================
-- OBJETS pour SIGNALER > Parking
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'parking'), 'barriere_parking', 'Barrière / Portail parking'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'parking'), 'eclairage_parking', 'Éclairage parking'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'parking'), 'stationnement_abusif', 'Stationnement abusif');

-- =============================================
-- OBJETS pour DEMANDER > Administratif
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'administratif'), 'attestation', 'Attestation / Document'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'administratif'), 'quittance', 'Quittance de loyer'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'administratif'), 'etat_lieux', 'État des lieux'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'administratif'), 'modification_bail', 'Modification de bail');

-- =============================================
-- OBJETS pour DEMANDER > Intervention technique
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'technique'), 'remplacement_equipement', 'Remplacement équipement'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'technique'), 'installation', 'Installation / Pose'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'technique'), 'depannage', 'Dépannage urgent');

-- =============================================
-- OBJETS pour DEMANDER > Accès / Badge
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'acces_badge'), 'nouveau_badge', 'Nouveau badge'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'acces_badge'), 'badge_perdu', 'Badge perdu'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'acces_badge'), 'cle_supplementaire', 'Clé supplémentaire'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'acces_badge'), 'acces_temporaire', 'Accès temporaire');

-- =============================================
-- OBJETS pour DEMANDER > Déménagement
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'demenagement'), 'reservation_monte_charge', 'Réservation monte-charge'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'demenagement'), 'autorisation_demenagement', 'Autorisation déménagement');

-- =============================================
-- OBJETS pour DEMANDER > Réservation
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'reservation'), 'salle_reunion', 'Salle de réunion'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'reservation'), 'espace_commun', 'Espace commun'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'reservation'), 'local_velos', 'Local vélos');

-- =============================================
-- OBJETS pour DEMANDER > Courrier / Colis
-- =============================================
INSERT INTO tax_objects (id, category_id, key, label) VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'courrier_colis'), 'colis_non_recu', 'Colis non reçu'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'courrier_colis'), 'boite_lettres_pleine', 'Boîte aux lettres pleine'),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'courrier_colis'), 'etiquette_nom', 'Étiquette nom manquante');

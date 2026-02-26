
-- Objects for 'informer' > 'Général'
INSERT INTO tax_objects (id, category_id, key, label, urgency_level)
VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'general' AND action_id = (SELECT id FROM tax_actions WHERE key = 'informer')), 'travaux', 'Travaux', 2),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'general' AND action_id = (SELECT id FROM tax_actions WHERE key = 'informer')), 'evenement', 'Événement', 1),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'general' AND action_id = (SELECT id FROM tax_actions WHERE key = 'informer')), 'information_diverse', 'Information diverse', 1);

-- Objects for 'verifier' > 'Contrôle périodique'
INSERT INTO tax_objects (id, category_id, key, label, urgency_level)
VALUES
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'controle_periodique' AND action_id = (SELECT id FROM tax_actions WHERE key = 'verifier')), 'extincteurs', 'Extincteurs', 3),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'controle_periodique' AND action_id = (SELECT id FROM tax_actions WHERE key = 'verifier')), 'eclairage_securite', 'Éclairage de sécurité', 3),
  (gen_random_uuid(), (SELECT id FROM tax_categories WHERE key = 'controle_periodique' AND action_id = (SELECT id FROM tax_actions WHERE key = 'verifier')), 'portes_coupe_feu', 'Portes coupe-feu', 3);

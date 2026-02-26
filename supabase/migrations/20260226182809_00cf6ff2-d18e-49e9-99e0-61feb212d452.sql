
INSERT INTO tax_categories (id, action_id, key, label)
VALUES 
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'informer'), 'general', 'Général'),
  (gen_random_uuid(), (SELECT id FROM tax_actions WHERE key = 'verifier'), 'controle_periodique', 'Contrôle périodique');

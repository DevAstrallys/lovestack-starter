
-- Clean all taxonomy data
TRUNCATE tax_details, tax_objects, tax_categories, tax_actions CASCADE;

-- Re-insert exactly 4 unique actions
INSERT INTO tax_actions (id, key, label, icon, color, description) VALUES
  (gen_random_uuid(), 'signaler', 'Je signale', 'AlertTriangle', 'destructive', 'Pannes, sinistres, dysfonctionnements'),
  (gen_random_uuid(), 'demander', 'Je demande', 'HelpCircle', 'primary', 'Services administratifs, techniques, documents'),
  (gen_random_uuid(), 'informer', 'J''informe', 'MessageSquare', 'secondary', 'Vie de l''immeuble, travaux, informations'),
  (gen_random_uuid(), 'verifier', 'Je vérifie', 'ShieldCheck', 'accent', 'Contrôles, passages, registre de sécurité');

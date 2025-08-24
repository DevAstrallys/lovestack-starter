-- ============================================================
-- 1) TABLES PRINCIPALES
-- ============================================================

-- Lieux
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enum pour initialité
CREATE TYPE initiality_enum AS ENUM ('initial', 'relance');

-- Tickets avec structure complète
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  initiality initiality_enum NOT NULL DEFAULT 'initial',
  follow_up_of_id uuid NULL REFERENCES tickets(id) ON DELETE SET NULL,
  relance_index int NULL,
  action text NOT NULL,     -- "Je signale" | "Je demande" | "J'informe"
  category text NOT NULL,
  object text NOT NULL,
  title text NOT NULL,      -- titre généré pour la recherche
  description text,
  attachments jsonb,        -- [{name,url,size}] (optionnel)
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  contact_info jsonb        -- informations de contact du demandeur
);

-- ============================================================
-- 2) TAXONOMIE GLOBALE (base par défaut)
-- ============================================================

-- Actions principales
CREATE TABLE IF NOT EXISTS tax_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,      -- "Je signale" | "Je demande" | "J'informe"
  key text NOT NULL UNIQUE  -- "signale" | "demande" | "informe"
);

-- Catégories par action
CREATE TABLE IF NOT EXISTS tax_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES tax_actions(id) ON DELETE CASCADE,
  label text NOT NULL,
  key text NOT NULL
);

-- Objets par catégorie
CREATE TABLE IF NOT EXISTS tax_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES tax_categories(id) ON DELETE CASCADE,
  label text NOT NULL,
  key text NOT NULL
);

-- ============================================================
-- 3) OVERRIDES PAR LIEU
-- ============================================================

-- Désactiver/activer des catégories par lieu
CREATE TABLE IF NOT EXISTS location_category_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES tax_categories(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  UNIQUE (location_id, category_id)
);

-- Désactiver/activer des objets par lieu
CREATE TABLE IF NOT EXISTS location_object_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  object_id uuid NOT NULL REFERENCES tax_objects(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  UNIQUE (location_id, object_id)
);

-- Objets personnalisés par lieu
CREATE TABLE IF NOT EXISTS location_custom_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES tax_categories(id) ON DELETE CASCADE,
  custom_label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true
);

-- ============================================================
-- 4) TRIGGERS ET FONCTIONS
-- ============================================================

-- Fonction de calcul de l'index de relance
CREATE OR REPLACE FUNCTION public.compute_relance_index()
RETURNS trigger AS $$
DECLARE 
  n integer;
BEGIN
  IF NEW.initiality = 'relance' AND NEW.follow_up_of_id IS NOT NULL THEN
    SELECT count(*) INTO n
    FROM tickets t
    WHERE t.follow_up_of_id = NEW.follow_up_of_id
      AND t.initiality = 'relance';
    NEW.relance_index := n + 1;
  ELSE
    NEW.relance_index := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour calculer l'index de relance
DROP TRIGGER IF EXISTS trg_compute_relance ON tickets;
CREATE TRIGGER trg_compute_relance
  BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION public.compute_relance_index();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_tickets_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trg_update_tickets_updated_at ON tickets;
CREATE TRIGGER trg_update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_tickets_updated_at();

-- Contrainte d'intégrité pour les relances
ALTER TABLE tickets
  DROP CONSTRAINT IF EXISTS relance_followup_consistency;

ALTER TABLE tickets
  ADD CONSTRAINT relance_followup_consistency
  CHECK (
    (initiality = 'relance' AND follow_up_of_id IS NOT NULL AND relance_index IS NOT NULL)
    OR
    (initiality = 'initial' AND follow_up_of_id IS NULL AND relance_index IS NULL)
  );

-- ============================================================
-- 5) RLS POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_category_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_object_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_custom_objects ENABLE ROW LEVEL SECURITY;

-- RLS pour taxonomie (lecture publique)
CREATE POLICY "Everyone can read taxonomies" ON tax_actions FOR SELECT USING (true);
CREATE POLICY "Everyone can read categories" ON tax_categories FOR SELECT USING (true);  
CREATE POLICY "Everyone can read objects" ON tax_objects FOR SELECT USING (true);

-- RLS basique pour locations (à adapter selon votre système d'auth)
CREATE POLICY "Users can read locations they have access to" ON locations 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM location_memberships lm 
      WHERE lm.location_id = id 
        AND lm.user_id = auth.uid() 
        AND lm.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN roles r ON r.id = m.role_id  
      WHERE m.user_id = auth.uid() 
        AND m.is_active = true 
        AND r.code = 'admin_platform'
    )
  );

-- RLS pour tickets (accès par lieu)
CREATE POLICY "Users can read tickets for their locations" ON tickets 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM location_memberships lm 
      WHERE lm.location_id = tickets.location_id 
        AND lm.user_id = auth.uid() 
        AND lm.is_active = true
    )
    OR created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN roles r ON r.id = m.role_id  
      WHERE m.user_id = auth.uid() 
        AND m.is_active = true 
        AND r.code = 'admin_platform'
    )
  );

CREATE POLICY "Users can create tickets for accessible locations" ON tickets 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM location_memberships lm 
      WHERE lm.location_id = tickets.location_id 
        AND lm.user_id = auth.uid() 
        AND lm.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN roles r ON r.id = m.role_id  
      WHERE m.user_id = auth.uid() 
        AND m.is_active = true 
        AND r.code = 'admin_platform'
    )
  );

-- RLS pour overrides (gestion par lieu)
CREATE POLICY "Location managers can manage overrides" ON location_category_overrides 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM location_memberships lm 
      JOIN roles r ON r.id = lm.role_id
      WHERE lm.location_id = location_category_overrides.location_id 
        AND lm.user_id = auth.uid() 
        AND lm.is_active = true
        AND r.code IN ('admin', 'manager')
    )
  );

CREATE POLICY "Location managers can manage object overrides" ON location_object_overrides 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM location_memberships lm 
      JOIN roles r ON r.id = lm.role_id
      WHERE lm.location_id = location_object_overrides.location_id 
        AND lm.user_id = auth.uid() 
        AND lm.is_active = true
        AND r.code IN ('admin', 'manager')
    )
  );

CREATE POLICY "Location managers can manage custom objects" ON location_custom_objects 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM location_memberships lm 
      JOIN roles r ON r.id = lm.role_id
      WHERE lm.location_id = location_custom_objects.location_id 
        AND lm.user_id = auth.uid() 
        AND lm.is_active = true
        AND r.code IN ('admin', 'manager')
    )
  );
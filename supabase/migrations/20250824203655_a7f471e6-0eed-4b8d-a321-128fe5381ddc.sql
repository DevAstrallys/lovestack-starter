-- ============================================================
-- 1) ENUM ET TYPES
-- ============================================================

-- Enum pour initialité
DO $$ BEGIN
    CREATE TYPE initiality_enum AS ENUM ('initial', 'relance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2) TABLES PRINCIPALES
-- ============================================================

-- Lieux
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  created_at timestamptz DEFAULT now()
);

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

-- Tickets avec structure complète (sans contrainte pour l'instant)
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
-- 4) FONCTIONS ET TRIGGERS
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

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_tickets_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS trg_compute_relance ON tickets;
CREATE TRIGGER trg_compute_relance
  BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION public.compute_relance_index();

DROP TRIGGER IF EXISTS trg_update_tickets_updated_at ON tickets;
CREATE TRIGGER trg_update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_tickets_updated_at();
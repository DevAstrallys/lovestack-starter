-- ============================================================
-- CORRECTION DES RLS POLICIES AVEC BONNE STRUCTURE
-- ============================================================

-- 1) Activation de RLS sur toutes les nouvelles tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_category_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_object_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_custom_objects ENABLE ROW LEVEL SECURITY;

-- 2) Correction des fonctions avec search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_tickets_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3) RLS Policies simples pour commencer

-- Taxonomie: lecture publique pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read actions" ON tax_actions 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read categories" ON tax_categories 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read objects" ON tax_objects 
  FOR SELECT TO authenticated USING (true);

-- Locations: accès temporaire pour les utilisateurs authentifiés (à adapter plus tard)
CREATE POLICY "Authenticated users can read locations" ON locations 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create locations" ON locations 
  FOR INSERT TO authenticated WITH CHECK (true);

-- Tickets: accès basique pour commencer
CREATE POLICY "Users can read their own tickets" ON tickets 
  FOR SELECT TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users can create tickets" ON tickets 
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own tickets" ON tickets 
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Overrides: accès restreint aux administrateurs platform pour commencer
CREATE POLICY "Platform admins can manage category overrides" ON location_category_overrides 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN roles r ON r.id = m.role_id  
      WHERE m.user_id = auth.uid() 
        AND m.is_active = true 
        AND r.code = 'admin_platform'
    )
  );

CREATE POLICY "Platform admins can manage object overrides" ON location_object_overrides 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN roles r ON r.id = m.role_id  
      WHERE m.user_id = auth.uid() 
        AND m.is_active = true 
        AND r.code = 'admin_platform'
    )
  );

CREATE POLICY "Platform admins can manage custom objects" ON location_custom_objects 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN roles r ON r.id = m.role_id  
      WHERE m.user_id = auth.uid() 
        AND m.is_active = true 
        AND r.code = 'admin_platform'
    )
  );
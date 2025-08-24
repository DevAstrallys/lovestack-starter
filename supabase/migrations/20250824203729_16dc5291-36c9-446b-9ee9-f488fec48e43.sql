-- ============================================================
-- CORRECTION DES PROBLÈMES DE SÉCURITÉ
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

-- 3) RLS Policies de base (sécurisées)

-- Taxonomie: lecture publique pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read actions" ON tax_actions 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read categories" ON tax_categories 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read objects" ON tax_objects 
  FOR SELECT TO authenticated USING (true);

-- Locations: accès basé sur les memberships de locations
CREATE POLICY "Users can read accessible locations" ON locations 
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM location_memberships lm 
      WHERE lm.location_id = locations.id 
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

-- Tickets: accès par lieu + créateur
CREATE POLICY "Users can read accessible tickets" ON tickets 
  FOR SELECT TO authenticated USING (
    created_by = auth.uid()
    OR
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

CREATE POLICY "Users can create tickets for accessible locations" ON tickets 
  FOR INSERT TO authenticated WITH CHECK (
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

CREATE POLICY "Ticket creators can update their tickets" ON tickets 
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM location_memberships lm 
      JOIN roles r ON r.id = lm.role_id
      WHERE lm.location_id = tickets.location_id 
        AND lm.user_id = auth.uid() 
        AND lm.is_active = true
        AND r.code IN ('admin', 'manager')
    )
  );

-- Overrides: gestion par administrateurs de lieux
CREATE POLICY "Location admins can manage category overrides" ON location_category_overrides 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM location_memberships lm 
      JOIN roles r ON r.id = lm.role_id
      WHERE lm.location_id = location_category_overrides.location_id 
        AND lm.user_id = auth.uid() 
        AND lm.is_active = true
        AND r.code IN ('admin', 'manager')
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

CREATE POLICY "Location admins can manage object overrides" ON location_object_overrides 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM location_memberships lm 
      JOIN roles r ON r.id = lm.role_id
      WHERE lm.location_id = location_object_overrides.location_id 
        AND lm.user_id = auth.uid() 
        AND lm.is_active = true
        AND r.code IN ('admin', 'manager')
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

CREATE POLICY "Location admins can manage custom objects" ON location_custom_objects 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM location_memberships lm 
      JOIN roles r ON r.id = lm.role_id
      WHERE lm.location_id = location_custom_objects.location_id 
        AND lm.user_id = auth.uid() 
        AND lm.is_active = true
        AND r.code IN ('admin', 'manager')
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

-- Contrainte d'intégrité pour les relances (ajoutée maintenant que la table existe)
DO $$ 
BEGIN
    ALTER TABLE tickets
      ADD CONSTRAINT relance_followup_consistency
      CHECK (
        (initiality = 'relance' AND follow_up_of_id IS NOT NULL AND relance_index IS NOT NULL)
        OR
        (initiality = 'initial' AND follow_up_of_id IS NULL AND relance_index IS NULL)
      );
EXCEPTION
    WHEN duplicate_object THEN 
        -- Contrainte existe déjà, rien à faire
        NULL;
END $$;
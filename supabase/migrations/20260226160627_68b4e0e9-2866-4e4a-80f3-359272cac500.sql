
-- Step 1: Migrate junction table data to parent_id columns
-- Groups: set parent_id from location_ensemble_groups
UPDATE location_groups lg
SET parent_id = leg.ensemble_id
FROM location_ensemble_groups leg
WHERE leg.group_id = lg.id
AND lg.parent_id IS NULL;

-- Elements: set parent_id from location_group_elements
UPDATE location_elements le
SET parent_id = lge.group_id
FROM location_group_elements lge
WHERE lge.element_id = le.id
AND le.parent_id IS NULL;

-- Step 2: Drop junction tables (RLS policies will be dropped automatically)
DROP TABLE IF EXISTS location_ensemble_groups CASCADE;
DROP TABLE IF EXISTS location_group_elements CASCADE;

-- Step 3: Fix CASCADE on parent_id FKs
ALTER TABLE location_groups
  DROP CONSTRAINT IF EXISTS location_groups_parent_id_fkey,
  ADD CONSTRAINT location_groups_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES location_ensembles(id) ON DELETE CASCADE;

ALTER TABLE location_elements
  DROP CONSTRAINT IF EXISTS location_elements_parent_id_fkey,
  ADD CONSTRAINT location_elements_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES location_groups(id) ON DELETE CASCADE;

-- Step 4: Add CASCADE to location_memberships FKs
ALTER TABLE location_memberships
  DROP CONSTRAINT IF EXISTS location_memberships_element_id_fkey,
  ADD CONSTRAINT location_memberships_element_id_fkey
    FOREIGN KEY (element_id) REFERENCES location_elements(id) ON DELETE CASCADE;

ALTER TABLE location_memberships
  DROP CONSTRAINT IF EXISTS location_memberships_group_id_fkey,
  ADD CONSTRAINT location_memberships_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES location_groups(id) ON DELETE CASCADE;

ALTER TABLE location_memberships
  DROP CONSTRAINT IF EXISTS location_memberships_ensemble_id_fkey,
  ADD CONSTRAINT location_memberships_ensemble_id_fkey
    FOREIGN KEY (ensemble_id) REFERENCES location_ensembles(id) ON DELETE CASCADE;

-- Step 5: Create hybrid hierarchy access function
-- Admin/Manager roles cascade down, operational roles (member, viewer) require explicit access
CREATE OR REPLACE FUNCTION public.fn_user_has_location_access(
  uid uuid,
  target_type text,  -- 'ensemble', 'group', 'element'
  target_id uuid,
  org_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  has_access boolean := false;
  parent_group_id uuid;
  parent_ensemble_id uuid;
BEGIN
  -- 1. Check direct explicit membership at this level
  IF target_type = 'element' THEN
    SELECT true INTO has_access
    FROM location_memberships lm
    WHERE lm.user_id = uid AND lm.element_id = target_id
      AND lm.organization_id = org_id AND lm.is_active = true
    LIMIT 1;
  ELSIF target_type = 'group' THEN
    SELECT true INTO has_access
    FROM location_memberships lm
    WHERE lm.user_id = uid AND lm.group_id = target_id
      AND lm.organization_id = org_id AND lm.is_active = true
    LIMIT 1;
  ELSIF target_type = 'ensemble' THEN
    SELECT true INTO has_access
    FROM location_memberships lm
    WHERE lm.user_id = uid AND lm.ensemble_id = target_id
      AND lm.organization_id = org_id AND lm.is_active = true
    LIMIT 1;
  END IF;

  IF has_access THEN RETURN true; END IF;

  -- 2. Check cascading access from parent levels (only for admin/manager roles)
  IF target_type = 'element' THEN
    -- Element -> check parent Group
    SELECT le.parent_id INTO parent_group_id
    FROM location_elements le WHERE le.id = target_id;
    
    IF parent_group_id IS NOT NULL THEN
      -- Check if user has admin/manager role on this group
      SELECT true INTO has_access
      FROM location_memberships lm
      JOIN roles r ON r.id = lm.role_id
      WHERE lm.user_id = uid AND lm.group_id = parent_group_id
        AND lm.organization_id = org_id AND lm.is_active = true
        AND r.code IN ('admin', 'admin_org', 'admin_platform', 'manager', 'gestionnaire')
      LIMIT 1;
      
      IF has_access THEN RETURN true; END IF;
      
      -- Group -> check parent Ensemble
      SELECT lg.parent_id INTO parent_ensemble_id
      FROM location_groups lg WHERE lg.id = parent_group_id;
      
      IF parent_ensemble_id IS NOT NULL THEN
        SELECT true INTO has_access
        FROM location_memberships lm
        JOIN roles r ON r.id = lm.role_id
        WHERE lm.user_id = uid AND lm.ensemble_id = parent_ensemble_id
          AND lm.organization_id = org_id AND lm.is_active = true
          AND r.code IN ('admin', 'admin_org', 'admin_platform', 'manager', 'gestionnaire')
        LIMIT 1;
        
        IF has_access THEN RETURN true; END IF;
      END IF;
    END IF;
    
  ELSIF target_type = 'group' THEN
    -- Group -> check parent Ensemble
    SELECT lg.parent_id INTO parent_ensemble_id
    FROM location_groups lg WHERE lg.id = target_id;
    
    IF parent_ensemble_id IS NOT NULL THEN
      SELECT true INTO has_access
      FROM location_memberships lm
      JOIN roles r ON r.id = lm.role_id
      WHERE lm.user_id = uid AND lm.ensemble_id = parent_ensemble_id
        AND lm.organization_id = org_id AND lm.is_active = true
        AND r.code IN ('admin', 'admin_org', 'admin_platform', 'manager', 'gestionnaire')
      LIMIT 1;
      
      IF has_access THEN RETURN true; END IF;
    END IF;
  END IF;

  -- 3. Fallback: check org-level permission (existing behavior)
  RETURN fn_has_org_perm(uid, org_id, 'locations.read');
END;
$$;

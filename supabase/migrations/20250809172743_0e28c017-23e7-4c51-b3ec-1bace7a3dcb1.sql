-- Create essential RLS policies for main tables

-- 1. Roles and permissions: read-only for authenticated users
CREATE POLICY "roles_read_all" ON public.roles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "permissions_read_all" ON public.permissions  
FOR SELECT TO authenticated USING (true);

CREATE POLICY "role_permissions_read_all" ON public.role_permissions
FOR SELECT TO authenticated USING (true);

CREATE POLICY "modules_read_all" ON public.modules
FOR SELECT TO authenticated USING (true);

-- 2. Buildings: based on membership
CREATE POLICY "buildings_read_members" ON public.buildings
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.building_id = buildings.id 
    AND m.is_active = true
  )
);

CREATE POLICY "buildings_write_admins" ON public.buildings
FOR ALL TO authenticated USING (
  public.fn_has_perm(auth.uid(), buildings.id, 'building.write')
);

-- 3. Companies: based on permissions
CREATE POLICY "companies_read_permitted" ON public.companies
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.roles r ON r.id = m.role_id  
    JOIN public.role_permissions rp ON rp.role_id = r.id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE m.user_id = auth.uid() 
    AND m.is_active = true
    AND p.code = 'company.read'
  )
);

-- 4. Profiles: users can read/write their own
CREATE POLICY "profiles_read_own" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_write_own" ON public.profiles  
FOR ALL TO authenticated USING (auth.uid() = id);

-- 5. Notifications: users manage their own
CREATE POLICY "notifications_prefs_own" ON public.notifications_prefs
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 6. QR codes: building-scoped
CREATE POLICY "qr_codes_read_building" ON public.qr_codes
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
    AND m.building_id = qr_codes.building_id
    AND m.is_active = true
  )
);

-- 7. Building structure (blocks, entrances, floors, units): building-scoped
CREATE POLICY "building_blocks_read_members" ON public.building_blocks
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
    AND m.building_id = building_blocks.building_id
    AND m.is_active = true
  )
);

CREATE POLICY "entrances_read_members" ON public.entrances
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
    AND m.building_id = entrances.building_id
    AND m.is_active = true
  )
);

CREATE POLICY "floors_read_members" ON public.floors
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
    AND m.building_id = floors.building_id
    AND m.is_active = true
  )
);

CREATE POLICY "units_read_members" ON public.units
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
    AND m.building_id = units.building_id
    AND m.is_active = true
  )
);

-- 8. Equipment: building-scoped  
CREATE POLICY "equipment_read_members" ON public.equipment
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
    AND m.building_id = equipment.building_id
    AND m.is_active = true
  )
);

-- 9. Tickets: restore the main policy with corrected function
CREATE POLICY "tickets_select_scoped" ON public.tickets
FOR SELECT TO authenticated USING (
  (created_by = auth.uid()) OR 
  (assigned_to = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM ticket_followers tf 
    WHERE tf.ticket_id = tickets.id 
    AND tf.user_id = auth.uid()
  )) OR
  (EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.roles r ON r.id = m.role_id
    JOIN public.role_permissions rp ON rp.role_id = r.id  
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE m.user_id = auth.uid()
    AND m.is_active = true
    AND m.building_id = tickets.building_id
    AND p.code = 'ticket.read'
    AND public.fn_context_covers(m.block_id, m.entrance_id, m.floor_id, m.unit_id, tickets.location)
  ))
);

-- 10. Basic admin-only policies for system tables
CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid()
    AND m.is_active = true  
    AND r.code = 'admin_platform'
  )
);

-- 11. Contract management
CREATE POLICY "contracts_read_building" ON public.contracts
FOR SELECT TO authenticated USING (
  public.fn_has_perm(auth.uid(), contracts.building_id, 'contract.read')
);

-- 12. Document management  
CREATE POLICY "documents_read_scoped" ON public.documents
FOR SELECT TO authenticated USING (
  (visibility = 'public') OR
  (created_by = auth.uid()) OR
  (public.fn_has_perm(auth.uid(), documents.building_id, 'document.read'))
);

-- 13. Building modules: building admins can configure
CREATE POLICY "building_modules_admin" ON public.building_modules
FOR ALL TO authenticated USING (
  public.fn_has_perm(auth.uid(), building_modules.building_id, 'building.write')
);
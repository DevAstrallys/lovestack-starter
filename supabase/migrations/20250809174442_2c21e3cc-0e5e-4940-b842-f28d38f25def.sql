-- Créer les politiques RLS manquantes basées sur la vraie structure

-- Politiques pour contracts
CREATE POLICY "Users can view contracts for their buildings" ON public.contracts
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Building managers can create contracts" ON public.contracts
FOR INSERT WITH CHECK (
  public.fn_has_perm(auth.uid(), building_id, 'contracts.create')
);

CREATE POLICY "Building managers can update contracts" ON public.contracts
FOR UPDATE USING (
  public.fn_has_perm(auth.uid(), building_id, 'contracts.update')
);

-- Politiques pour building_modules
CREATE POLICY "Users can view modules for their buildings" ON public.building_modules
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can manage building modules" ON public.building_modules
FOR ALL USING (
  public.fn_has_perm(auth.uid(), building_id, 'modules.manage')
);

-- Politiques pour equipment
CREATE POLICY "Users can view equipment in their buildings" ON public.equipment
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Building managers can manage equipment" ON public.equipment
FOR ALL USING (
  public.fn_has_perm(auth.uid(), building_id, 'equipment.manage')
);

-- Politiques pour qr_codes
CREATE POLICY "Users can view QR codes for their buildings" ON public.qr_codes
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Building managers can manage QR codes" ON public.qr_codes
FOR ALL USING (
  public.fn_has_perm(auth.uid(), building_id, 'qr_codes.manage')
);

-- Politiques pour survey_responses
CREATE POLICY "Users can view their own survey responses" ON public.survey_responses
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own survey responses" ON public.survey_responses
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view survey responses in their buildings" ON public.survey_responses
FOR SELECT USING (
  survey_id IN (
    SELECT id FROM public.surveys s
    WHERE s.building_id IN (
      SELECT building_id FROM public.memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- Politiques pour surveys
CREATE POLICY "Users can view surveys for their buildings" ON public.surveys
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Building managers can manage surveys" ON public.surveys
FOR ALL USING (
  public.fn_has_perm(auth.uid(), building_id, 'surveys.manage')
);

-- Politiques pour memberships
CREATE POLICY "Users can view their own memberships" ON public.memberships
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view memberships in their buildings" ON public.memberships
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.memberships 
    WHERE user_id = auth.uid() AND is_active = true
    AND role_id IN (SELECT id FROM public.roles WHERE name IN ('admin', 'manager'))
  )
);

CREATE POLICY "Admins can manage memberships" ON public.memberships
FOR ALL USING (
  public.fn_has_perm(auth.uid(), building_id, 'memberships.manage')
);

-- Politiques pour profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can create their own profile" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());

-- Politiques pour permissions
CREATE POLICY "All authenticated users can view permissions" ON public.permissions
FOR SELECT TO authenticated USING (true);

-- Politiques pour roles
CREATE POLICY "All authenticated users can view roles" ON public.roles
FOR SELECT TO authenticated USING (true);

-- Politiques pour buildings
CREATE POLICY "Users can view their buildings" ON public.buildings
FOR SELECT USING (
  id IN (
    SELECT building_id FROM public.memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can manage buildings" ON public.buildings
FOR ALL USING (
  public.fn_has_perm(auth.uid(), id, 'buildings.manage')
);

-- Politiques pour building_blocks
CREATE POLICY "Users can view blocks in their buildings" ON public.building_blocks
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Politiques pour entrances
CREATE POLICY "Users can view entrances in their buildings" ON public.entrances
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Politiques pour floors
CREATE POLICY "Users can view floors in their buildings" ON public.floors
FOR SELECT USING (
  entrance_id IN (
    SELECT e.id FROM public.entrances e
    WHERE e.building_id IN (
      SELECT building_id FROM public.memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- Politiques pour units
CREATE POLICY "Users can view units in their buildings" ON public.units
FOR SELECT USING (
  floor_id IN (
    SELECT f.id FROM public.floors f
    JOIN public.entrances e ON e.id = f.entrance_id
    WHERE e.building_id IN (
      SELECT building_id FROM public.memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);
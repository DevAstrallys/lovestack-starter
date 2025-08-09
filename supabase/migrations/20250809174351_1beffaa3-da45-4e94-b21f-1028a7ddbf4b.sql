-- Créer les politiques RLS manquantes pour sécuriser complètement la base de données

-- Politiques pour contracts
CREATE POLICY "Users can view contracts for their buildings" ON public.contracts
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.user_buildings 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Building managers can create contracts" ON public.contracts
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Building managers can update contracts" ON public.contracts
FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Politiques pour building_modules
CREATE POLICY "Users can view modules for their buildings" ON public.building_modules
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.user_buildings 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage building modules" ON public.building_modules
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour building_structure
CREATE POLICY "Users can view structure for their buildings" ON public.building_structure
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.user_buildings 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Building managers can manage structure" ON public.building_structure
FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Politiques pour equipment
CREATE POLICY "Users can view equipment in their buildings" ON public.equipment
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.user_buildings 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Building managers can manage equipment" ON public.equipment
FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Politiques pour qr_codes
CREATE POLICY "Users can view QR codes for their buildings" ON public.qr_codes
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.user_buildings 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Building managers can manage QR codes" ON public.qr_codes
FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Politiques pour survey_responses
CREATE POLICY "Users can view their own survey responses" ON public.survey_responses
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own survey responses" ON public.survey_responses
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all survey responses" ON public.survey_responses
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour surveys
CREATE POLICY "Users can view surveys for their buildings" ON public.surveys
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM public.user_buildings 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Building managers can manage surveys" ON public.surveys
FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Politiques pour user_buildings
CREATE POLICY "Users can view their own building associations" ON public.user_buildings
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all building associations" ON public.user_buildings
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage building associations" ON public.user_buildings
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can create their own profile" ON public.profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour permissions
CREATE POLICY "All authenticated users can view permissions" ON public.permissions
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage permissions" ON public.permissions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour roles
CREATE POLICY "All authenticated users can view roles" ON public.roles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage roles" ON public.roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour buildings
CREATE POLICY "Users can view their buildings" ON public.buildings
FOR SELECT USING (
  id IN (
    SELECT building_id FROM public.user_buildings 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage buildings" ON public.buildings
FOR ALL USING (public.has_role(auth.uid(), 'admin'));
-- Create location_tags table
CREATE TABLE IF NOT EXISTS public.location_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create location_elements table
CREATE TABLE IF NOT EXISTS public.location_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location_data JSONB,
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create location_groups table
CREATE TABLE IF NOT EXISTS public.location_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create location_ensembles table
CREATE TABLE IF NOT EXISTS public.location_ensembles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction tables
CREATE TABLE IF NOT EXISTS public.location_element_tags (
  element_id UUID NOT NULL REFERENCES public.location_elements(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.location_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (element_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.location_group_elements (
  group_id UUID NOT NULL REFERENCES public.location_groups(id) ON DELETE CASCADE,
  element_id UUID NOT NULL REFERENCES public.location_elements(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, element_id)
);

CREATE TABLE IF NOT EXISTS public.location_group_tags (
  group_id UUID NOT NULL REFERENCES public.location_groups(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.location_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.location_ensemble_groups (
  ensemble_id UUID NOT NULL REFERENCES public.location_ensembles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.location_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (ensemble_id, group_id)
);

CREATE TABLE IF NOT EXISTS public.location_ensemble_tags (
  ensemble_id UUID NOT NULL REFERENCES public.location_ensembles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.location_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (ensemble_id, tag_id)
);

-- Enable RLS on all tables
ALTER TABLE public.location_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_ensembles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_element_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_group_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_group_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_ensemble_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_ensemble_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for location_tags
CREATE POLICY "Users can view tags for their buildings" ON public.location_tags
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can manage tags for their buildings" ON public.location_tags
FOR ALL USING (
  fn_has_perm(auth.uid(), building_id, 'building.write')
);

-- Create RLS policies for location_elements
CREATE POLICY "Users can view elements for their buildings" ON public.location_elements
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can manage elements for their buildings" ON public.location_elements
FOR ALL USING (
  fn_has_perm(auth.uid(), building_id, 'building.write')
);

-- Create RLS policies for location_groups
CREATE POLICY "Users can view groups for their buildings" ON public.location_groups
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can manage groups for their buildings" ON public.location_groups
FOR ALL USING (
  fn_has_perm(auth.uid(), building_id, 'building.write')
);

-- Create RLS policies for location_ensembles
CREATE POLICY "Users can view ensembles for their buildings" ON public.location_ensembles
FOR SELECT USING (
  building_id IN (
    SELECT building_id FROM memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can manage ensembles for their buildings" ON public.location_ensembles
FOR ALL USING (
  fn_has_perm(auth.uid(), building_id, 'building.write')
);

-- Create RLS policies for junction tables
CREATE POLICY "Users can view element tags for their buildings" ON public.location_element_tags
FOR SELECT USING (
  element_id IN (
    SELECT id FROM location_elements 
    WHERE building_id IN (
      SELECT building_id FROM memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

CREATE POLICY "Users can manage element tags for their buildings" ON public.location_element_tags
FOR ALL USING (
  element_id IN (
    SELECT id FROM location_elements 
    WHERE fn_has_perm(auth.uid(), building_id, 'building.write')
  )
);

CREATE POLICY "Users can view group elements for their buildings" ON public.location_group_elements
FOR SELECT USING (
  group_id IN (
    SELECT id FROM location_groups 
    WHERE building_id IN (
      SELECT building_id FROM memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

CREATE POLICY "Users can manage group elements for their buildings" ON public.location_group_elements
FOR ALL USING (
  group_id IN (
    SELECT id FROM location_groups 
    WHERE fn_has_perm(auth.uid(), building_id, 'building.write')
  )
);

CREATE POLICY "Users can view group tags for their buildings" ON public.location_group_tags
FOR SELECT USING (
  group_id IN (
    SELECT id FROM location_groups 
    WHERE building_id IN (
      SELECT building_id FROM memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

CREATE POLICY "Users can manage group tags for their buildings" ON public.location_group_tags
FOR ALL USING (
  group_id IN (
    SELECT id FROM location_groups 
    WHERE fn_has_perm(auth.uid(), building_id, 'building.write')
  )
);

CREATE POLICY "Users can view ensemble groups for their buildings" ON public.location_ensemble_groups
FOR SELECT USING (
  ensemble_id IN (
    SELECT id FROM location_ensembles 
    WHERE building_id IN (
      SELECT building_id FROM memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

CREATE POLICY "Users can manage ensemble groups for their buildings" ON public.location_ensemble_groups
FOR ALL USING (
  ensemble_id IN (
    SELECT id FROM location_ensembles 
    WHERE fn_has_perm(auth.uid(), building_id, 'building.write')
  )
);

CREATE POLICY "Users can view ensemble tags for their buildings" ON public.location_ensemble_tags
FOR SELECT USING (
  ensemble_id IN (
    SELECT id FROM location_ensembles 
    WHERE building_id IN (
      SELECT building_id FROM memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

CREATE POLICY "Users can manage ensemble tags for their buildings" ON public.location_ensemble_tags
FOR ALL USING (
  ensemble_id IN (
    SELECT id FROM location_ensembles 
    WHERE fn_has_perm(auth.uid(), building_id, 'building.write')
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_location_tags_updated_at
  BEFORE UPDATE ON public.location_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_location_elements_updated_at
  BEFORE UPDATE ON public.location_elements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_location_groups_updated_at
  BEFORE UPDATE ON public.location_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_location_ensembles_updated_at
  BEFORE UPDATE ON public.location_ensembles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
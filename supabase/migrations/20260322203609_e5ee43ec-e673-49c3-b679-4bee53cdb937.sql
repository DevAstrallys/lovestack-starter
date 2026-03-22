
-- Table tax_suggestions: crowd-sourced taxonomy terms
CREATE TABLE IF NOT EXISTS public.tax_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  qr_code_id uuid REFERENCES public.qr_codes(id),
  type text NOT NULL CHECK (type IN ('category','object','location')),
  free_text text NOT NULL,
  action_id uuid REFERENCES public.tax_actions(id),
  category_id uuid REFERENCES public.tax_categories(id),
  occurrences integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','auto_approved','pending_review')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup on free_text + type + action/category
CREATE INDEX idx_tax_suggestions_lookup ON public.tax_suggestions (type, free_text, action_id, category_id);

-- RLS
ALTER TABLE public.tax_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form, anonymous users)
CREATE POLICY "Anyone can insert tax suggestions"
  ON public.tax_suggestions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Platform admins can view all
CREATE POLICY "Platform admins can view tax suggestions"
  ON public.tax_suggestions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN roles r ON r.id = m.role_id
      WHERE m.user_id = auth.uid()
        AND m.is_active = true
        AND r.code = 'admin_platform'
    )
  );

-- Platform admins can update (manage status)
CREATE POLICY "Platform admins can update tax suggestions"
  ON public.tax_suggestions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN roles r ON r.id = m.role_id
      WHERE m.user_id = auth.uid()
        AND m.is_active = true
        AND r.code = 'admin_platform'
    )
  );

-- Auto-approve trigger function
CREATE OR REPLACE FUNCTION public.fn_auto_approve_tax_suggestion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.occurrences >= 50 AND OLD.occurrences < 50 THEN
    IF NEW.type = 'category' AND NEW.action_id IS NOT NULL THEN
      NEW.status := 'auto_approved';
      INSERT INTO public.tax_categories (action_id, key, label)
      VALUES (NEW.action_id, 'auto_' || replace(lower(NEW.free_text), ' ', '_'), NEW.free_text);
    ELSIF NEW.type = 'object' AND NEW.category_id IS NOT NULL THEN
      NEW.status := 'auto_approved';
      INSERT INTO public.tax_objects (category_id, key, label, urgency_level)
      VALUES (NEW.category_id, 'auto_' || replace(lower(NEW.free_text), ' ', '_'), NEW.free_text, 2);
    ELSIF NEW.type = 'location' THEN
      NEW.status := 'pending_review';
      -- Location auto-creation is NOT done; admin must review
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_approve_tax_suggestion
  BEFORE UPDATE ON public.tax_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_approve_tax_suggestion();

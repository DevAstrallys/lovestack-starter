
-- 1. Add 4th level: tax_details (Nature/Détail)
CREATE TABLE IF NOT EXISTS public.tax_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  object_id uuid NOT NULL REFERENCES public.tax_objects(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  label_i18n jsonb DEFAULT NULL,
  is_private boolean NOT NULL DEFAULT false,
  urgency_level smallint NOT NULL DEFAULT 2 CHECK (urgency_level BETWEEN 1 AND 4)
);

-- 2. Add urgency_level default on tax_objects for objects without details
ALTER TABLE public.tax_objects ADD COLUMN IF NOT EXISTS urgency_level smallint DEFAULT 2;
ALTER TABLE public.tax_objects ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

-- 3. Add is_premium to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- 4. Add icon column to tax_actions for button display
ALTER TABLE public.tax_actions ADD COLUMN IF NOT EXISTS icon text DEFAULT NULL;
ALTER TABLE public.tax_actions ADD COLUMN IF NOT EXISTS color text DEFAULT NULL;
ALTER TABLE public.tax_actions ADD COLUMN IF NOT EXISTS description text DEFAULT NULL;

-- 5. RLS for tax_details: public read (needed for QR form), admin write
ALTER TABLE public.tax_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tax_details" ON public.tax_details
  FOR SELECT USING (true);

CREATE POLICY "Platform admins can manage tax_details" ON public.tax_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN roles r ON r.id = m.role_id
      WHERE m.user_id = auth.uid() AND m.is_active = true AND r.code = 'admin_platform'
    )
  );

-- 6. Seed the 4 axes with icons and colors
INSERT INTO public.tax_actions (key, label, icon, color, description) VALUES
  ('signaler', 'Je signale', 'AlertTriangle', 'destructive', 'Pannes, sinistres, dysfonctionnements'),
  ('demander', 'Je demande', 'HelpCircle', 'primary', 'Demandes administratives, techniques, documents'),
  ('informer', 'J''informe', 'MessageSquare', 'accent', 'Vie de l''immeuble, travaux, informations'),
  ('verifier', 'Je vérifie', 'ShieldCheck', 'secondary', 'Contrôles, passages, registre de sécurité')
ON CONFLICT DO NOTHING;

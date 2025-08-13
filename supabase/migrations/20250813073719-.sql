-- Enable RLS on all unprotected tables
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Company Users: Only company members and platform admins can manage
CREATE POLICY "Users can view their own company memberships" 
ON public.company_users 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Platform admins can manage company users" 
ON public.company_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
      AND m.is_active = true 
      AND r.code = 'admin_platform'
  )
);

-- Equipment Contracts: Follow building permissions
CREATE POLICY "Building managers can view equipment contracts" 
ON public.equipment_contracts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM equipment e
    WHERE e.id = equipment_contracts.equipment_id
      AND fn_has_perm(auth.uid(), e.building_id, 'contract.read')
  )
);

CREATE POLICY "Building managers can manage equipment contracts" 
ON public.equipment_contracts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM equipment e
    WHERE e.id = equipment_contracts.equipment_id
      AND fn_has_perm(auth.uid(), e.building_id, 'contracts.manage')
  )
);

-- Document Links: Follow document and ticket permissions
CREATE POLICY "Users can view document links for accessible documents and tickets" 
ON public.document_links 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM documents d
    WHERE d.id = document_links.document_id
      AND (d.visibility = 'public' OR d.created_by = auth.uid() OR fn_has_perm(auth.uid(), d.building_id, 'document.read'))
  )
);

CREATE POLICY "Users can create document links for accessible content" 
ON public.document_links 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM documents d
    WHERE d.id = document_links.document_id
      AND (d.created_by = auth.uid() OR fn_has_perm(auth.uid(), d.building_id, 'document.manage'))
  )
);

-- Ticket Followers: Users can follow tickets they have access to
CREATE POLICY "Users can view their own ticket follows" 
ON public.ticket_followers 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can follow tickets they can access" 
ON public.ticket_followers 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1
    FROM tickets t
    WHERE t.id = ticket_followers.ticket_id
      AND (t.created_by = auth.uid() OR fn_has_perm(auth.uid(), t.building_id, 'ticket.read'))
  )
);

CREATE POLICY "Users can unfollow their own tickets" 
ON public.ticket_followers 
FOR DELETE 
USING (user_id = auth.uid());

-- Scheduled Reports: Follow report permissions
CREATE POLICY "Report creators can view their scheduled reports" 
ON public.scheduled_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM reports r
    WHERE r.id = scheduled_reports.report_id
      AND (r.created_by = auth.uid() OR fn_has_perm(auth.uid(), r.building_id, 'reports.manage'))
  )
);

CREATE POLICY "Building managers can manage scheduled reports" 
ON public.scheduled_reports 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM reports r
    WHERE r.id = scheduled_reports.report_id
      AND fn_has_perm(auth.uid(), r.building_id, 'reports.manage')
  )
);

-- Survey Questions: Follow survey permissions
CREATE POLICY "Users can view questions for accessible surveys" 
ON public.survey_questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM surveys s
    WHERE s.id = survey_questions.survey_id
      AND fn_has_perm(auth.uid(), s.building_id, 'surveys.view')
  )
);

CREATE POLICY "Survey creators can manage questions" 
ON public.survey_questions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM surveys s
    WHERE s.id = survey_questions.survey_id
      AND fn_has_perm(auth.uid(), s.building_id, 'surveys.manage')
  )
);

-- Taxonomies: Read-only for authenticated users (system data)
CREATE POLICY "Authenticated users can view taxonomies" 
ON public.taxonomies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only platform admins can manage taxonomies" 
ON public.taxonomies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid() 
      AND m.is_active = true 
      AND r.code = 'admin_platform'
  )
);

-- Webhooks: Building administrators only
CREATE POLICY "Building administrators can manage webhooks" 
ON public.webhooks 
FOR ALL 
USING (fn_has_perm(auth.uid(), building_id, 'webhooks.manage'));
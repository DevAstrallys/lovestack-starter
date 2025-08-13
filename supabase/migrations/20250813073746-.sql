-- Add missing RLS policies for tables that were flagged

-- Tickets table: Enable comprehensive access control
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tickets they created or have building access" 
ON public.tickets 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR
  fn_has_perm(auth.uid(), building_id, 'ticket.read')
);

CREATE POLICY "Users can create tickets for buildings they have access to" 
ON public.tickets 
FOR INSERT 
WITH CHECK (fn_has_perm(auth.uid(), building_id, 'ticket.create'));

CREATE POLICY "Users can update tickets they own or have building permissions" 
ON public.tickets 
FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR
  fn_has_perm(auth.uid(), building_id, 'ticket.write')
);

-- Ticket Attachments: Follow ticket permissions
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments for accessible tickets" 
ON public.ticket_attachments 
FOR SELECT 
USING (
  uploaded_by = auth.uid() OR
  EXISTS (
    SELECT 1
    FROM tickets t
    WHERE t.id = ticket_attachments.ticket_id
      AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR fn_has_perm(auth.uid(), t.building_id, 'ticket.read'))
  )
);

CREATE POLICY "Users can upload attachments to accessible tickets" 
ON public.ticket_attachments 
FOR INSERT 
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1
    FROM tickets t
    WHERE t.id = ticket_attachments.ticket_id
      AND (t.created_by = auth.uid() OR fn_has_perm(auth.uid(), t.building_id, 'ticket.write'))
  )
);

-- Ticket Events: Follow ticket permissions
ALTER TABLE public.ticket_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events for accessible tickets" 
ON public.ticket_events 
FOR SELECT 
USING (
  actor_id = auth.uid() OR
  EXISTS (
    SELECT 1
    FROM tickets t
    WHERE t.id = ticket_events.ticket_id
      AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR fn_has_perm(auth.uid(), t.building_id, 'ticket.read'))
  )
);

CREATE POLICY "System and authorized users can create ticket events" 
ON public.ticket_events 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM tickets t
    WHERE t.id = ticket_events.ticket_id
      AND (t.created_by = auth.uid() OR fn_has_perm(auth.uid(), t.building_id, 'ticket.write'))
  )
);

-- Reports: Follow building permissions
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports for accessible buildings" 
ON public.reports 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  fn_has_perm(auth.uid(), building_id, 'reports.read')
);

CREATE POLICY "Building managers can create reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (fn_has_perm(auth.uid(), building_id, 'reports.create'));

CREATE POLICY "Report creators and building managers can update reports" 
ON public.reports 
FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  fn_has_perm(auth.uid(), building_id, 'reports.manage')
);
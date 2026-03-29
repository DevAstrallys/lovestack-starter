ALTER TABLE public.ticket_activities DROP CONSTRAINT ticket_activities_activity_type_check;
ALTER TABLE public.ticket_activities ADD CONSTRAINT ticket_activities_activity_type_check
  CHECK (activity_type = ANY (ARRAY['message','comment','status_change','assignment','priority_change','attachment','duplicate_link']));
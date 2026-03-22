-- Cleanup test data using a temporary security definer function
-- to bypass RLS restrictions on DELETE operations

CREATE OR REPLACE FUNCTION public.fn_cleanup_test_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM ticket_followers;
  DELETE FROM ticket_attachments;
  DELETE FROM ticket_activities;
  DELETE FROM ticket_events;
  DELETE FROM document_links;
  DELETE FROM tickets;
  DELETE FROM tax_suggestions;
  DELETE FROM qr_codes;
END;
$$;

-- Execute the cleanup
SELECT public.fn_cleanup_test_data();

-- Drop the temporary function immediately
DROP FUNCTION public.fn_cleanup_test_data();

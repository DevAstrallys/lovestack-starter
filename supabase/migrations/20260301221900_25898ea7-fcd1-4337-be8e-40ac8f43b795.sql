
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the expiration check every hour
SELECT cron.schedule(
  'expire-memberships-hourly',
  '0 * * * *',
  $$SELECT net.http_post(
    url := 'https://tqegmwatmpqzhjrujfcd.supabase.co/functions/v1/expire-memberships',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZWdtd2F0bXBxemhqcnVqZmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTYyMjUsImV4cCI6MjA3MDMzMjIyNX0._dDl3JzKp_8Dra7Br-Nguxy8fwgt21aYmq6L9qbare8"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;$$
);

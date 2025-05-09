
-- Enable the required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to run the sync daily
CREATE OR REPLACE FUNCTION public.sync_employee_mappings_job()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://fvpbkkmnzlxbcxokxkce.supabase.co/functions/v1/sync-employee-mappings',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('supabase_functions.jwt', true) || '"}'::jsonb,
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule the job to run daily at 1 AM
SELECT cron.schedule(
  'sync-employee-mappings-daily',
  '0 1 * * *',  -- At 01:00 every day
  $$SELECT public.sync_employee_mappings_job()$$
);

-- Or uncomment this to run it weekly on Sunday at 1 AM
-- SELECT cron.schedule(
--   'sync-employee-mappings-weekly',
--   '0 1 * * 0',  -- At 01:00 on Sunday
--   $$SELECT public.sync_employee_mappings_job()$$
-- );

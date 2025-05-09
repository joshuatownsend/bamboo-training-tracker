
-- Create or replace the database function that the cron job calls
-- This function will be called by both the cron job and the manual button
CREATE OR REPLACE FUNCTION public.sync_employee_mappings_job()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  -- Invoke the edge function using pg_net
  SELECT 
    content::json INTO result
  FROM
    net.http_post(
      url := 'https://fvpbkkmnzlxbcxokxkce.supabase.co/functions/v1/sync-employee-mappings',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || 
                  current_setting('supabase_functions.jwt', true) || '"}'::jsonb,
      body := '{}'::jsonb
    );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Make sure the function is executable by the appropriate roles
GRANT EXECUTE ON FUNCTION public.sync_employee_mappings_job() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_employee_mappings_job() TO service_role;

-- Update the cron job to use the new function
DO $$
BEGIN
  -- Drop existing job if it exists
  PERFORM cron.unschedule('sync-employee-mappings-daily');
  
  -- Recreate the job with the new function
  PERFORM cron.schedule(
    'sync-employee-mappings-daily',
    '0 1 * * *',  -- At 01:00 every day
    $$SELECT public.sync_employee_mappings_job()$$
  );
END;
$$;


-- Reset stalled sync status and update trigger_bamboohr_sync function 
-- to call the fixed version of the sync-bamboohr-data function

-- First, reset the stalled sync status
UPDATE public.sync_status
SET status = 'ready',
    error = NULL,
    updated_at = now()
WHERE id = 'bamboohr' 
  AND status = 'running';

-- Update the trigger_bamboohr_sync function to call the fixed edge function
CREATE OR REPLACE FUNCTION public.trigger_bamboohr_sync()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  response JSONB;
  service_key TEXT;
BEGIN
  -- Get the service role key 
  SELECT current_setting('supabase.service_role_key', true) INTO service_key;
  
  -- If service_role_key is not available, try using anon_key as fallback
  IF service_key IS NULL OR service_key = '' THEN
    SELECT current_setting('supabase.anon_key', true) INTO service_key;
  END IF;
  
  -- Update the sync status to show it's starting
  UPDATE public.sync_status
  SET status = 'running',
      error = NULL,
      updated_at = now()
  WHERE id = 'bamboohr';
  
  -- Call the FIXED version of the edge function to sync employee data
  -- Using the array format for headers which is compatible with older versions
  -- of the pg_net extension that powers http_post
  SELECT content::JSONB INTO response
  FROM extensions.http_post(
    'https://fvpbkkmnzlxbcxokxkce.supabase.co/functions/v1/sync-bamboohr-data-fix',
    ARRAY[
      ('Content-Type', 'application/json'),
      ('Authorization', 'Bearer ' || service_key)
    ],
    '{}'::jsonb
  );
  
  RETURN response;
EXCEPTION WHEN OTHERS THEN
  -- If anything goes wrong, update the status to show the error
  UPDATE public.sync_status
  SET status = 'error',
      error = SQLERRM,
      updated_at = now()
  WHERE id = 'bamboohr';
  
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update the function comment to document the changes
COMMENT ON FUNCTION public.trigger_bamboohr_sync() IS 
$$
This function triggers the BambooHR data sync process by calling the sync-bamboohr-data-fix edge function.

Updates from May 19, 2025:
- Changed to use the fixed sync-bamboohr-data-fix edge function instead of the original
- Reset stalled sync status to allow new sync attempts
- Maintained array format for headers compatible with older pg_net versions
$$;


-- Update the trigger_bamboohr_sync function to use the correct http_post function signature
CREATE OR REPLACE FUNCTION public.trigger_bamboohr_sync()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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
  
  -- Call the edge function to sync employee data
  -- Use named parameters for http_post to ensure correct function signature
  SELECT content::JSONB INTO response
  FROM extensions.http_post(
    url := 'https://fvpbkkmnzlxbcxokxkce.supabase.co/functions/v1/sync-bamboohr-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb
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

-- Make sure we have a sync_status record for BambooHR
INSERT INTO public.sync_status (id, status, updated_at)
VALUES ('bamboohr', 'never_run', now())
ON CONFLICT (id) DO NOTHING;

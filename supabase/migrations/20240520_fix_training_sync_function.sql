
-- Fix the trigger_training_completions_sync function to properly handle responses
CREATE OR REPLACE FUNCTION public.trigger_training_completions_sync()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  request_id BIGINT;
  service_role_key TEXT;
  anon_key TEXT;
  auth_header TEXT;
  function_url TEXT;
  response_code INT;
  response_body TEXT;
BEGIN
  -- Log function start with timestamp for debugging
  RAISE NOTICE 'Training completions sync triggered at %', now();
  
  -- Get the service role key from environment variables (primary)
  BEGIN
    service_role_key := current_setting('supabase.service_role_key', true);
    RAISE NOTICE 'Service role key retrieved: %', CASE WHEN service_role_key IS NOT NULL THEN 'Yes' ELSE 'No' END;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Could not retrieve service_role_key: %', SQLERRM;
    service_role_key := NULL;
  END;
  
  -- Get the anon key as fallback
  BEGIN
    anon_key := current_setting('supabase.anon_key', true);
    RAISE NOTICE 'Anon key retrieved: %', CASE WHEN anon_key IS NOT NULL THEN 'Yes' ELSE 'No' END;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Could not retrieve anon_key: %', SQLERRM;
    anon_key := NULL;
  END;
  
  -- Determine which key to use
  IF service_role_key IS NOT NULL THEN
    auth_header := 'Bearer ' || service_role_key;
    RAISE NOTICE 'Using service_role_key for authentication';
  ELSIF anon_key IS NOT NULL THEN
    auth_header := 'Bearer ' || anon_key;
    RAISE NOTICE 'Using anon_key for authentication (fallback)';
  ELSE
    RAISE EXCEPTION 'No authentication keys available';
  END;
  
  -- Update the sync status to show it's starting
  UPDATE public.sync_status
  SET status = 'running',
      error = NULL,
      updated_at = now(),
      details = jsonb_build_object(
        'start_time', now(),
        'triggered_by', 'Database function',
        'auth_method', CASE WHEN service_role_key IS NOT NULL THEN 'service_role' ELSE 'anon_key' END
      )
  WHERE id = 'training_completions';
  
  -- Insert a record if it doesn't exist
  INSERT INTO public.sync_status (id, status, updated_at)
  VALUES ('training_completions', 'running', now())
  ON CONFLICT (id) DO NOTHING;
  
  -- Define the function URL explicitly
  function_url := 'https://fvpbkkmnzlxbcxokxkce.supabase.co/functions/v1/sync-training-completions';
  
  -- Call the edge function with the appropriate auth header
  -- This is the fix: we're now correctly handling the response structure from net.http_post
  SELECT 
    status, content, id 
  INTO 
    response_code, response_body, request_id
  FROM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', auth_header
    ),
    body := '{}'::JSONB
  );
  
  -- Check the response code
  IF response_code = 401 THEN
    RAISE WARNING 'Authentication failed (401) when calling edge function';
    
    -- Try the alternative key if we have both
    IF service_role_key IS NOT NULL AND anon_key IS NOT NULL AND auth_header = 'Bearer ' || service_role_key THEN
      RAISE NOTICE 'Retrying with anon_key as fallback';
      auth_header := 'Bearer ' || anon_key;
      
      SELECT 
        status, content, id 
      INTO 
        response_code, response_body, request_id
      FROM net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', auth_header
        ),
        body := '{}'::JSONB
      );
    END IF;
  END IF;
  
  -- Final check on response
  IF response_code >= 200 AND response_code < 300 THEN
    -- Return a success message with the request ID
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Training completions sync initiated successfully',
      'request_id', request_id,
      'response_code', response_code,
      'auth_method', CASE WHEN auth_header = 'Bearer ' || service_role_key THEN 'service_role' ELSE 'anon_key' END
    );
  ELSE
    -- Update status to reflect the error
    UPDATE public.sync_status
    SET status = 'error',
        error = format('Edge function returned error code %s: %s', response_code, response_body),
        updated_at = now()
    WHERE id = 'training_completions';
    
    -- Return error information
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Edge function returned error code %s', response_code),
      'response_body', response_body,
      'auth_method', CASE WHEN auth_header = 'Bearer ' || service_role_key THEN 'service_role' ELSE 'anon_key' END
    );
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  -- If anything goes wrong, update the status to show the error
  UPDATE public.sync_status
  SET status = 'error',
      error = SQLERRM,
      updated_at = now(),
      details = jsonb_build_object(
        'error_time', now(),
        'error_details', SQLERRM,
        'auth_method', CASE 
          WHEN auth_header = 'Bearer ' || service_role_key THEN 'service_role' 
          WHEN auth_header = 'Bearer ' || anon_key THEN 'anon_key'
          ELSE 'unknown'
        END
      )
  WHERE id = 'training_completions';
  
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

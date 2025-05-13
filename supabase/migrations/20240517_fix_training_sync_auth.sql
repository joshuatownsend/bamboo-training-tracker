
-- Fix authentication issue with the training sync function
CREATE OR REPLACE FUNCTION public.trigger_training_completions_sync()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  request_id BIGINT;
  anon_key TEXT;
BEGIN
  -- Get the anon key from environment variables
  anon_key := current_setting('supabase.anon_key', true);
  
  -- Update the sync status to show it's starting
  UPDATE public.sync_status
  SET status = 'running',
      error = NULL,
      updated_at = now()
  WHERE id = 'training_completions';
  
  -- Insert a record if it doesn't exist
  INSERT INTO public.sync_status (id, status, updated_at)
  VALUES ('training_completions', 'running', now())
  ON CONFLICT (id) DO NOTHING;
  
  -- Call the edge function with proper authorization to sync training completion data
  SELECT request_id INTO request_id
  FROM net.http_post(
    url := 'https://fvpbkkmnzlxbcxokxkce.supabase.co/functions/v1/sync-training-completions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'apikey', anon_key
    ),
    body := '{}'::JSONB
  );
  
  -- Return a success message with the request ID
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Training completions sync initiated successfully',
    'request_id', request_id
  );
  
EXCEPTION WHEN OTHERS THEN
  -- If anything goes wrong, update the status to show the error
  UPDATE public.sync_status
  SET status = 'error',
      error = SQLERRM,
      updated_at = now()
  WHERE id = 'training_completions';
  
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

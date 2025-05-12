
-- Enable the required extensions for cron jobs if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS net;

-- Add a daily cron job to sync BambooHR data
SELECT cron.schedule(
  'sync-bamboohr-daily',
  '0 3 * * *', -- Run at 3:00 AM every day 
  $$
  SELECT public.trigger_bamboohr_sync();
  $$
);

-- Create a function to check the last sync time
CREATE OR REPLACE FUNCTION public.get_last_sync_info()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  last_sync_record RECORD;
BEGIN
  -- Get the latest sync information
  SELECT * INTO last_sync_record 
  FROM public.sync_status
  WHERE id = 'bamboohr';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'unknown',
      'last_sync', null,
      'updated_at', null,
      'error', 'No sync status record found'
    );
  END IF;

  RETURN jsonb_build_object(
    'status', last_sync_record.status,
    'last_sync', last_sync_record.last_sync,
    'updated_at', last_sync_record.updated_at,
    'error', last_sync_record.error
  );
END;
$$;

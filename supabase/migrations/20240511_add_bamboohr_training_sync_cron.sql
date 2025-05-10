
-- Enable the required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add a daily cron job to sync BambooHR training types
SELECT cron.schedule(
  'sync-bamboohr-trainings-daily',
  '0 0 * * *', -- Run at midnight every day
  $$
  SELECT
    net.http_post(
      url:='https://fvpbkkmnzlxbcxokxkce.supabase.co/functions/v1/sync-bamboo-trainings',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGJra21uemx4YmN4b2t4a2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTY1NDIsImV4cCI6MjA2MjIzMjU0Mn0.82Za5hPaRoR3kha2hwMF4pdAmPIYA79dCFwGDwnuaKk"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Add a function to manually trigger the sync
CREATE OR REPLACE FUNCTION public.sync_bamboohr_trainings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT
    net.http_post(
      url:='https://fvpbkkmnzlxbcxokxkce.supabase.co/functions/v1/sync-bamboo-trainings',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGJra21uemx4YmN4b2t4a2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTY1NDIsImV4cCI6MjA2MjIzMjU0Mn0.82Za5hPaRoR3kha2hwMF4pdAmPIYA79dCFwGDwnuaKk"}'::jsonb,
      body:='{}'::jsonb
    ) INTO result;

  RETURN jsonb_build_object('success', true, 'message', 'Training sync initiated', 'result', result);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

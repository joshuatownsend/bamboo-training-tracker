
-- Create a migration to document our improvements to the BambooHR sync process
-- This is for documentation purposes only since we updated the function directly

COMMENT ON FUNCTION public.trigger_bamboohr_sync() IS 
$$
This function triggers the BambooHR data sync process by calling the sync-bamboohr-data edge function.

Updates from May 17, 2025:
- Fixed the trigger_bamboohr_sync function to use extensions.http_post with named parameters
- Fixed the "input of anonymous composite types is not implemented" error
- Improved error handling and sync status updates
- Added proper parameter handling and URL construction for BambooHR API requests
$$;


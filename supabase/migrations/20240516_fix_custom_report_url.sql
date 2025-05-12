
-- Fix the custom report URL handling in the sync-bamboohr-data edge function
-- This migration simply serves as documentation of the changes we made to the edge function

COMMENT ON FUNCTION public.trigger_bamboohr_sync() IS 
$$
This function triggers the BambooHR data sync process by calling the sync-bamboohr-data edge function.

Updates from May 16, 2024:
- Fixed URL parameter handling in bamboohr edge function to properly format the custom report URL
- Added better error handling for 404 responses from BambooHR API
- Improved handling of custom report URLs to prevent double-encoding of parameters
$$;



-- Create a migration to document our improvements to the BambooHR sync process
-- This is for documentation purposes only since we updated the function directly

COMMENT ON FUNCTION public.trigger_bamboohr_sync() IS 
$$
This function triggers the BambooHR data sync process by calling the sync-bamboohr-data edge function.

Updates from May 17, 2025:
- Fixed the sync-bamboohr-data edge function to use proper snake_case column names
- Changed displayName to display_name
- Changed firstName to first_name
- Changed lastName to last_name
- Changed workEmail to work_email
- Changed jobTitle to job_title
- Changed hireDate to hire_date
- Improved error handling and sync status updates
$$;


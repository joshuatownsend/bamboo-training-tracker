
-- Create a function to check if a user has admin access
-- This function can query various admin-related tables to determine access
CREATE OR REPLACE FUNCTION public.check_admin_access(admin_email TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- First check the admin_users table
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = admin_email
  ) INTO is_admin;
  
  -- If already found as admin, return true
  IF is_admin THEN
    RETURN true;
  END IF;
  
  -- Additional checks could be added here, for example:
  -- Checking admin emails in a settings table or other configuration
  
  -- Return the result
  RETURN false;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.check_admin_access(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_admin_access(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access(TEXT) TO anon;

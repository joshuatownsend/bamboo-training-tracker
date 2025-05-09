
-- Enable Row Level Security on the employee_mappings table
ALTER TABLE IF EXISTS public.employee_mappings ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows everyone to read the employee mappings
CREATE POLICY "Everyone can read employee mappings" 
ON public.employee_mappings 
FOR SELECT 
USING (true);

-- Create a policy that allows authenticated users to insert employee mappings
CREATE POLICY "Authenticated users can insert employee mappings" 
ON public.employee_mappings 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create a policy that allows authenticated users to update employee mappings
CREATE POLICY "Authenticated users can update employee mappings" 
ON public.employee_mappings 
FOR UPDATE 
TO authenticated 
USING (true);

-- Create a policy that allows authenticated users to delete employee mappings
CREATE POLICY "Authenticated users can delete employee mappings" 
ON public.employee_mappings 
FOR DELETE 
TO authenticated 
USING (true);

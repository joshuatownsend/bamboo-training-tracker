
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmployeeMapping {
  id: string;
  email: string;
  bamboo_employee_id: number; // Changed from string to number to match our DB schema
  created_at?: string;
  updated_at?: string;
}

const useEmployeeMapping = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get the BambooHR employee ID for a given email
  const getEmployeeIdByEmail = useCallback(async (email: string): Promise<string | null> => {
    if (!email) {
      console.log('No email provided to getEmployeeIdByEmail');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`Looking up employee ID for email: ${email}`);
      
      const { data, error } = await supabase
        .from('employee_mappings')
        .select('bamboo_employee_id')
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        console.log('No mapping found for email:', email, error);
        return null;
      }

      console.log(`Found employee ID for ${email}:`, data?.bamboo_employee_id);
      // Convert number to string for API compatibility
      return data?.bamboo_employee_id ? String(data.bamboo_employee_id) : null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting employee ID by email:', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save a mapping between email and employee ID
  const saveEmployeeMapping = useCallback(async (email: string, employeeId: string): Promise<boolean> => {
    if (!email || !employeeId) {
      console.error('Email and employee ID are required for saveEmployeeMapping');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`Saving employee mapping: ${email} -> ${employeeId}`);
      
      // Check if the user is authenticated before trying to save
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        const errorMessage = 'You must be authenticated to save employee mappings';
        setError(errorMessage);
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive"
        });
        return false;
      }
      
      // Convert employeeId to number for database storage
      const numericEmployeeId = parseInt(employeeId, 10);
      if (isNaN(numericEmployeeId)) {
        const errorMessage = 'Employee ID must be a valid number';
        setError(errorMessage);
        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive"
        });
        return false;
      }
      
      const { error } = await supabase
        .from('employee_mappings')
        .upsert({ 
          email: email.toLowerCase(), 
          bamboo_employee_id: numericEmployeeId,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'email' 
        });

      if (error) {
        console.error('Error saving employee mapping:', error);
        toast({
          title: "Error Saving Mapping",
          description: error.message,
          variant: "destructive"
        });
        setError(error.message);
        return false;
      }

      toast({
        title: "Mapping Saved",
        description: `Successfully mapped ${email} to employee ID ${employeeId}`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Error Saving Mapping",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save multiple mappings at once (for admin use)
  const saveBulkEmployeeMappings = useCallback(async (mappings: {email: string, employeeId: string}[]): Promise<boolean> => {
    if (!mappings || mappings.length === 0) {
      console.error('No mappings provided for saveBulkEmployeeMappings');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`Saving bulk employee mappings: ${mappings.length} records`);
      
      // Check if the user is authenticated before trying to save
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        const errorMessage = 'You must be authenticated to save employee mappings';
        setError(errorMessage);
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive"
        });
        return false;
      }
      
      // Convert string employeeId to number for database compatibility
      const formattedMappings = mappings.map(m => ({
        email: m.email.toLowerCase(),
        bamboo_employee_id: parseInt(m.employeeId, 10),
        updated_at: new Date().toISOString()
      }));
      
      // Handle any non-numeric IDs
      const hasInvalidIds = formattedMappings.some(m => isNaN(m.bamboo_employee_id));
      if (hasInvalidIds) {
        const errorMessage = 'Some employee IDs are not valid numbers';
        setError(errorMessage);
        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive"
        });
        return false;
      }
      
      const { error } = await supabase
        .from('employee_mappings')
        .upsert(formattedMappings, { 
          onConflict: 'email' 
        });

      if (error) {
        console.error('Error saving bulk employee mappings:', error);
        toast({
          title: "Error Saving Mappings",
          description: error.message,
          variant: "destructive"
        });
        setError(error.message);
        return false;
      }

      toast({
        title: "Mappings Saved",
        description: `Successfully saved ${mappings.length} employee mappings`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Error Saving Mappings",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Get all employee mappings (for admin use)
  const getAllEmployeeMappings = useCallback(async (): Promise<EmployeeMapping[]> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching all employee mappings');
      
      const { data, error } = await supabase
        .from('employee_mappings')
        .select('*')
        .order('email');

      if (error) {
        console.error('Error fetching employee mappings:', error);
        toast({
          title: "Error Fetching Mappings",
          description: error.message,
          variant: "destructive"
        });
        setError(error.message);
        throw error;
      }

      console.log(`Retrieved ${data?.length || 0} employee mappings`);
      
      // Convert the bamboo_employee_id back to string in the returned data
      // for compatibility with existing code
      return (data || []).map(item => ({
        ...item,
        bamboo_employee_id: Number(item.bamboo_employee_id)
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting all employee mappings:', errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Delete an employee mapping
  const deleteEmployeeMapping = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`Deleting employee mapping with ID: ${id}`);
      
      // Check if the user is authenticated before trying to delete
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        const errorMessage = 'You must be authenticated to delete employee mappings';
        setError(errorMessage);
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive"
        });
        return false;
      }
      
      const { error } = await supabase
        .from('employee_mappings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting employee mapping:', error);
        toast({
          title: "Error Deleting Mapping",
          description: error.message,
          variant: "destructive"
        });
        setError(error.message);
        return false;
      }

      toast({
        title: "Mapping Deleted",
        description: "Successfully deleted the employee mapping",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Error Deleting Mapping",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    error,
    getEmployeeIdByEmail,
    saveEmployeeMapping,
    saveBulkEmployeeMappings,
    getAllEmployeeMappings,
    deleteEmployeeMapping
  };
};

export default useEmployeeMapping;

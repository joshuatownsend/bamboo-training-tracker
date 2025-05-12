
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '@/lib/types';
import useBambooHR from './useBambooHR';

export interface EmployeeMapping {
  id: string;
  email: string;
  bamboo_employee_id: string;
  name: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  job_title: string | null;
  department: string | null;
  division: string | null;
  work_email: string | null;
  avatar: string | null;
  hire_date: string | null;
  status: string | null;
  last_sync: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UseEnhancedEmployeeDataResult {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  triggerSync: () => Promise<boolean>;
  lastSync: string | null;
}

/**
 * Custom hook to fetch employee data from the enhanced employee_mappings table
 */
const useEnhancedEmployeeData = (): UseEnhancedEmployeeDataResult => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const { toast } = useToast();
  const { isConfigured } = useBambooHR();

  // Function to fetch employee data from the enhanced employee_mappings table
  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all employee mappings
      const { data, error } = await supabase
        .from('employee_mappings')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      // Convert from employee_mappings to Employee type
      const mappedEmployees: Employee[] = (data || []).map((mapping: EmployeeMapping): Employee => ({
        id: mapping.bamboo_employee_id,
        name: mapping.name || `${mapping.first_name || ''} ${mapping.last_name || ''}`.trim() || mapping.email || 'Unknown',
        position: mapping.position || mapping.job_title || null,
        department: mapping.department || null,
        division: mapping.division || null,
        email: mapping.email,
        work_email: mapping.work_email || mapping.email,
        display_name: mapping.display_name || mapping.name || null,
        first_name: mapping.first_name || null,
        last_name: mapping.last_name || null,
        job_title: mapping.job_title || mapping.position || null,
        avatar: mapping.avatar || null,
        hire_date: mapping.hire_date || null
      }));

      setEmployees(mappedEmployees);
      
      // If we have data, update the last sync timestamp
      if (data && data.length > 0) {
        // Find the most recent sync
        const latestSync = data.reduce((latest, current) => {
          if (!latest || !latest.last_sync) return current;
          if (!current.last_sync) return latest;
          return new Date(current.last_sync) > new Date(latest.last_sync) ? current : latest;
        }, null as EmployeeMapping | null);
        
        setLastSync(latestSync?.last_sync || null);
      }

    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employee data');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger a sync with BambooHR
  const triggerSync = async (): Promise<boolean> => {
    if (!isConfigured) {
      toast({
        title: "BambooHR not configured",
        description: "Please configure BambooHR API settings first",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsLoading(true);
      
      // Get the auth session for the bearer token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Authentication required to trigger sync");
      }

      // Call the edge function to sync employee data
      const response = await fetch('https://fvpbkkmnzlxbcxokxkce.supabase.co/functions/v1/sync-employee-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({})
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Sync failed');
      }

      toast({
        title: "Sync complete",
        description: `Successfully synced ${result.count || 'unknown'} employee records`,
      });

      // Refetch the data to show the latest
      await fetchEmployees();
      
      return true;
    } catch (err) {
      console.error('Error triggering sync:', err);
      
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: "destructive"
      });
      
      setError(err instanceof Error ? err.message : 'Failed to sync data');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    isLoading,
    error,
    refetch: fetchEmployees,
    triggerSync,
    lastSync
  };
};

export default useEnhancedEmployeeData;

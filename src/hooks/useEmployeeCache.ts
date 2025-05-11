
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Employee, Training, TrainingCompletion } from "@/lib/types";
import useBambooHR from "./useBambooHR";

/**
 * Hook to fetch cached employee data from Supabase
 */
export function useEmployeeCache() {
  const { toast } = useToast();
  const { isConfigured } = useBambooHR();
  
  // Query to get sync status
  const syncStatus = useQuery({
    queryKey: ['sync-status', 'bamboohr'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'bamboohr')
        .single();
      
      if (error) {
        console.error("Error fetching sync status:", error);
        return null;
      }
      
      return data;
    }
  });
  
  // Query to fetch cached employees
  const employees = useQuery({
    queryKey: ['cached', 'employees'],
    queryFn: async () => {
      console.log("Fetching cached employees from Supabase");
      
      const { data, error } = await supabase
        .from('cached_employees')
        .select('*')
        .order('name');
      
      if (error) {
        console.error("Error fetching cached employees:", error);
        toast({
          title: "Error fetching employees",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      console.log(`Fetched ${data.length} cached employees`);
      
      // Map Supabase data to our Employee type
      return data.map((emp): Employee => ({
        id: emp.id,
        name: emp.name,
        displayName: emp.display_name,
        firstName: emp.first_name,
        lastName: emp.last_name,
        position: emp.position,
        jobTitle: emp.job_title,
        department: emp.department,
        division: emp.division,
        email: emp.email,
        workEmail: emp.work_email,
        avatar: emp.avatar,
        hireDate: emp.hire_date
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Query to fetch cached trainings
  const trainings = useQuery({
    queryKey: ['cached', 'trainings'],
    queryFn: async () => {
      console.log("Fetching cached trainings from Supabase");
      
      const { data, error } = await supabase
        .from('cached_trainings')
        .select('*')
        .order('title');
      
      if (error) {
        console.error("Error fetching cached trainings:", error);
        return [];
      }
      
      console.log(`Fetched ${data.length} cached trainings`);
      
      // Map Supabase data to our Training type
      return data.map((training): Training => ({
        id: training.id,
        title: training.title,
        type: training.type,
        category: training.category,
        description: training.description || '',
        durationHours: training.duration_hours || 0,
        requiredFor: training.required_for || []
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Query to fetch cached training completions
  const completions = useQuery({
    queryKey: ['cached', 'completions'],
    queryFn: async () => {
      console.log("Fetching cached training completions from Supabase");
      
      const { data, error } = await supabase
        .from('cached_training_completions')
        .select('*');
      
      if (error) {
        console.error("Error fetching cached training completions:", error);
        return [];
      }
      
      console.log(`Fetched ${data.length} cached training completions`);
      
      // Map Supabase data to our TrainingCompletion type
      return data.map((completion): TrainingCompletion => ({
        id: completion.id,
        employeeId: completion.employee_id,
        trainingId: completion.training_id,
        completionDate: completion.completion_date,
        expirationDate: completion.expiration_date,
        status: completion.status as any,
        score: completion.score,
        certificateUrl: completion.certificate_url
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Function to manually trigger a sync
  const triggerSync = async () => {
    try {
      toast({
        title: "Sync Started",
        description: "Starting employee data synchronization...",
      });
      
      const { data, error } = await supabase.rpc('trigger_bamboohr_sync');
      
      if (error) {
        console.error("Error triggering sync:", error);
        toast({
          title: "Sync Error",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Sync Requested",
        description: "Employee data synchronization has been requested.",
      });
      
      // Refetch the status after a short delay
      setTimeout(() => {
        syncStatus.refetch();
      }, 3000);
      
      return true;
    } catch (error) {
      console.error("Error in triggerSync:", error);
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    syncStatus: syncStatus.data,
    isSyncStatusLoading: syncStatus.isLoading,
    
    employees: employees.data || [],
    isEmployeesLoading: employees.isLoading,
    employeesError: employees.error,
    refetchEmployees: employees.refetch,
    
    trainings: trainings.data || [],
    isTrainingsLoading: trainings.isLoading,
    trainingsError: trainings.error,
    refetchTrainings: trainings.refetch,
    
    completions: completions.data || [],
    isCompletionsLoading: completions.isLoading,
    completionsError: completions.error,
    refetchCompletions: completions.refetch,
    
    triggerSync,
    
    // Helper functions
    refetchAll: () => {
      syncStatus.refetch();
      employees.refetch();
      trainings.refetch();
      completions.refetch();
    }
  };
}

export default useEmployeeCache;

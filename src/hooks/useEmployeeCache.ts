
import { useSyncStatus } from "./cache/useSyncStatus";
import { useEmployeesCache } from "./cache/useEmployeesCache";
import { useTrainingsCache } from "./cache/useTrainingsCache";
import { useCompletionsCache } from "./cache/useCompletionsCache";
import { useBambooSync } from "./cache/useBambooSync";
import useBambooHR from "./useBambooHR";

/**
 * Hook to fetch cached employee data from Supabase
 */
export function useEmployeeCache() {
  const { isConfigured } = useBambooHR();
  
  // Import all individual hooks
  const syncStatusQuery = useSyncStatus();
  const employeesQuery = useEmployeesCache();
  const trainingsQuery = useTrainingsCache();
  const completionsQuery = useCompletionsCache();
  const { triggerSync, isSyncing } = useBambooSync();
  
  // Function to refetch all data
  const refetchAll = async () => {
    await Promise.all([
      syncStatusQuery.refetch(),
      employeesQuery.refetch(),
      trainingsQuery.refetch(),
      completionsQuery.refetch()
    ]);
  };

  // Return a composited API
  return {
    syncStatus: syncStatusQuery.data,
    isSyncStatusLoading: syncStatusQuery.isLoading,
    
    employees: employeesQuery.data || [],
    isEmployeesLoading: employeesQuery.isLoading,
    employeesError: employeesQuery.error,
    refetchEmployees: employeesQuery.refetch,
    
    trainings: trainingsQuery.data || [],
    isTrainingsLoading: trainingsQuery.isLoading,
    trainingsError: trainingsQuery.error,
    refetchTrainings: trainingsQuery.refetch,
    
    completions: completionsQuery.data || [],
    isCompletionsLoading: completionsQuery.isLoading,
    completionsError: completionsQuery.error,
    refetchCompletions: completionsQuery.refetch,
    
    triggerSync,
    
    // Helper functions
    refetchAll
  };
}

export default useEmployeeCache;

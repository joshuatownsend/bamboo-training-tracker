
import { useSyncStatus } from "./cache/useSyncStatus";
import { useEmployeesCache } from "./cache/useEmployeesCache";
import { useTrainingsCache } from "./cache/useTrainingsCache";
import { useCompletionsCache } from "./cache/useCompletionsCache";
import { useBambooSync } from "./cache/useBambooSync";
import useBambooHR from "./useBambooHR";
import { useCallback } from "react";

/**
 * Hook to fetch cached employee data from Supabase
 * Optimized version with better caching and error handling
 */
export function useEmployeeCache() {
  const { isConfigured } = useBambooHR();
  
  // Import all individual hooks with { enabled } option to prevent unnecessary fetching
  const syncStatusQuery = useSyncStatus();
  const employeesQuery = useEmployeesCache();
  const trainingsQuery = useTrainingsCache();
  const completionsQuery = useCompletionsCache();
  const { triggerSync, isSyncing } = useBambooSync();
  
  // Function to refetch all data with performance logging
  const refetchAll = useCallback(async () => {
    console.log("Refetching all cached data...");
    const startTime = performance.now();
    
    try {
      await Promise.all([
        syncStatusQuery.refetch(),
        employeesQuery.refetch(),
        trainingsQuery.refetch(),
        completionsQuery.refetch()
      ]);
      
      const endTime = performance.now();
      console.log(`All data refetched in ${Math.round(endTime - startTime)}ms`);
    } catch (error) {
      console.error("Error refetching cached data:", error);
    }
  }, [syncStatusQuery, employeesQuery, trainingsQuery, completionsQuery]);

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
    isSyncing,
    
    // Helper functions
    refetchAll
  };
}

export default useEmployeeCache;

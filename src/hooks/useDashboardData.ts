
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { calculateTrainingStatistics } from "@/utils/calculateStatistics";
import useEmployeeCache from "@/hooks/useEmployeeCache";
import type { TrainingStatistics } from "@/lib/types";

/**
 * Custom hook for efficiently retrieving and processing dashboard data
 * Uses cached data from Supabase instead of direct API calls to BambooHR
 */
export function useDashboardData() {
  const { toast } = useToast();
  const { 
    employees, 
    trainings, 
    completions, 
    isEmployeesLoading, 
    isTrainingsLoading, 
    isCompletionsLoading,
    refetchAll,
    syncStatus
  } = useEmployeeCache();

  // Calculate statistics only when data is available and not loading
  // Use memoization to avoid recalculating unnecessarily
  const statistics = useMemo(() => {
    if (isEmployeesLoading || isTrainingsLoading || isCompletionsLoading) {
      return null;
    }

    try {
      console.log("Calculating dashboard statistics from cache...");
      return calculateTrainingStatistics(
        employees || [], 
        trainings || [], 
        completions || []
      );
    } catch (err) {
      console.error("Error calculating dashboard statistics:", err);
      toast({
        title: "Error calculating statistics",
        description: "There was a problem processing training data",
        variant: "destructive"
      });
      return null;
    }
  }, [employees, trainings, completions, isEmployeesLoading, isTrainingsLoading, isCompletionsLoading, toast]);

  // Single loading state derived from all data sources
  const isLoading = isEmployeesLoading || isTrainingsLoading || isCompletionsLoading;

  // Prefetch data on mount (if not already in cache)
  const prefetchQuery = useQuery({
    queryKey: ['dashboard', 'prefetch'],
    queryFn: async () => {
      try {
        await import('@/services/dataCacheService').then(({ prefetchBambooHRData }) => {
          prefetchBambooHRData();
        });
        return true;
      } catch (error) {
        console.error("Error prefetching data:", error);
        return false;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Function to manually trigger refresh
  const refreshDashboard = async () => {
    try {
      console.log("Manually refreshing dashboard data...");
      await refetchAll();
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh dashboard data",
        variant: "destructive"
      });
    }
  };

  return {
    // Data
    employees,
    trainings,
    completions,
    statistics,
    syncStatus,
    
    // Loading states
    isLoading,
    isPrefetching: prefetchQuery.isLoading,
    
    // Actions
    refreshDashboard
  };
}

export default useDashboardData;

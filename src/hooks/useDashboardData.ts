
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { calculateStatisticsAsync } from "@/utils/StatisticsWorker";
import useEmployeeCache from "@/hooks/useEmployeeCache";
import type { TrainingStatistics } from "@/lib/types";

/**
 * Custom hook for efficiently retrieving and processing dashboard data
 * Uses cached data from Supabase instead of direct API calls to BambooHR
 */
export function useDashboardData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

    if (!employees?.length || !trainings?.length) {
      console.log("Missing required data for statistics calculation:", {
        employeesCount: employees?.length || 0,
        trainingsCount: trainings?.length || 0,
        completionsCount: completions?.length || 0
      });
      return null;
    }

    try {
      console.log("Calculating dashboard statistics from cache...", {
        employeesCount: employees.length,
        trainingsCount: trainings.length,
        completionsCount: completions?.length || 0
      });
      
      return calculateStatisticsAsync(
        employees, 
        trainings, 
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
  const isLoading = isEmployeesLoading || isTrainingsLoading || isCompletionsLoading || !statistics;

  // Function to manually trigger refresh
  const refreshDashboard = async () => {
    try {
      console.log("Manually refreshing dashboard data...");
      await refetchAll();
      
      // Invalidate any prefetch query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'prefetch'] });
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
    
    // Actions
    refreshDashboard
  };
}

export default useDashboardData;

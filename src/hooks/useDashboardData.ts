import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import useEmployeeCache from "@/hooks/useEmployeeCache";
import { useCompletionsCache } from "@/hooks/cache";
import { calculateDashboardStatistics } from "@/utils/dashboardStatistics";
import { useTrainingData } from "@/hooks/dashboard/useTrainingData";
import { useSyncOperations } from "@/hooks/dashboard/useSyncOperations";
import { useCompletionFormatting } from "@/hooks/dashboard/useCompletionFormatting";
import useBambooHR from "@/hooks/useBambooHR";
import useDashboardStats from "@/hooks/dashboard/useDashboardStats";

/**
 * Custom hook for efficiently retrieving and processing dashboard data
 * Now uses optimized statistics for accurate counts while maintaining detailed data for displays
 */
export function useDashboardData() {
  const { toast } = useToast();
  const bambooClient = useBambooHR();
  
  // Get cached employees and trainings
  const { 
    employees, 
    isEmployeesLoading, 
    refetchAll,
    syncStatus: bambooSyncStatus
  } = useEmployeeCache();

  // Get training data using our focused hook
  const { trainings, isLoading: isTrainingsLoading } = useTrainingData();

  // Get training completions using our fixed cache hook - still needed for detailed views
  const { data: trainingCompletions, isLoading: isTrainingCompletionsLoading, refetch: refetchCompletions } = useCompletionsCache();

  // Get optimized dashboard statistics with accurate counts
  const { data: dashboardStats, isLoading: isDashboardStatsLoading, refetch: refetchStats } = useDashboardStats();

  // Format completions for consistent use across components
  const formattedCompletions = useCompletionFormatting(
    Array.isArray(trainingCompletions) ? trainingCompletions : []
  );

  // Handle sync operations with the dedicated hook
  const { 
    syncStatus: trainingSyncStatus, 
    refreshDashboard,
    triggerTrainingSync 
  } = useSyncOperations(async () => {
    await refetchAll();
    await refetchCompletions();
    await refetchStats(); // Also refresh the accurate statistics
  });

  // Log completion data for debugging
  useMemo(() => {
    if (formattedCompletions && formattedCompletions.length > 0) {
      console.log(`Dashboard has ${formattedCompletions.length} completion records available for detailed display`);
    } else {
      console.log("No detailed completion data available for Dashboard");
    }
    
    // Log the accurate count
    if (dashboardStats) {
      console.log(`Actual completion count from database: ${dashboardStats.completedTrainings}`);
    }
  }, [formattedCompletions, dashboardStats]);
  
  // Calculate detailed statistics when needed, but use accurate counts from dashboardStats
  const statistics = useMemo(() => {
    // Fast path: if we have dashboard stats already, prioritize those accurate counts
    if (dashboardStats && !isDashboardStatsLoading) {
      console.log("Using optimized dashboard statistics:", {
        totalTrainings: dashboardStats.totalTrainings,
        completedTrainings: dashboardStats.completedTrainings
      });
      return dashboardStats;
    }
    
    // Fallback to calculated statistics if needed
    const isLoading = isEmployeesLoading || isTrainingsLoading || isTrainingCompletionsLoading;
                     
    if (isLoading) {
      console.log("Still loading data, deferring statistics calculation");
      return null;
    }

    if (!formattedCompletions || formattedCompletions.length === 0) {
      console.log("No completion data available, cannot calculate statistics");
      return null;
    }

    const stats = calculateDashboardStatistics(
      employees, 
      trainings, 
      formattedCompletions,
      toast
    );
    
    console.log("Calculated dashboard statistics (legacy method):", {
      totalTrainings: stats?.totalTrainings,
      completedTrainings: stats?.completedTrainings,
      completionsUsed: formattedCompletions?.length
    });
    
    return stats;
  }, [
    employees, 
    trainings, 
    formattedCompletions,
    dashboardStats,
    isEmployeesLoading, 
    isTrainingsLoading, 
    isTrainingCompletionsLoading,
    isDashboardStatsLoading,
    toast
  ]);

  // Use the training completions sync status if available, otherwise use the bamboo sync status
  const syncStatus = trainingSyncStatus || bambooSyncStatus;

  // Single loading state derived from all data sources
  const isLoading = isEmployeesLoading || isTrainingsLoading || isTrainingCompletionsLoading || 
                   isDashboardStatsLoading || !statistics;

  return {
    // Data
    employees,
    trainings,
    completions: formattedCompletions,
    statistics,
    syncStatus,
    
    // Loading states
    isLoading,
    
    // Actions
    refreshDashboard,
    triggerTrainingSync
  };
}

export default useDashboardData;

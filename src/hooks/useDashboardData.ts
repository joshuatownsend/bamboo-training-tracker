
import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import useEmployeeCache from "@/hooks/useEmployeeCache";
import { useCompletionsCache } from "@/hooks/cache";
import { calculateDashboardStatistics } from "@/utils/dashboardStatistics";
import { useTrainingData } from "@/hooks/dashboard/useTrainingData";
import { useSyncOperations } from "@/hooks/dashboard/useSyncOperations";
import { useCompletionFormatting } from "@/hooks/dashboard/useCompletionFormatting";
import useBambooHR from "@/hooks/useBambooHR";

/**
 * Custom hook for efficiently retrieving and processing dashboard data
 * Uses cached data from Supabase instead of direct API calls to BambooHR
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

  // Get training completions using our fixed cache hook
  const { data: trainingCompletions, isLoading: isTrainingCompletionsLoading, refetch: refetchCompletions } = useCompletionsCache();

  // Format completions for consistent use across components
  const formattedCompletions = useCompletionFormatting(trainingCompletions);

  // Handle sync operations with the dedicated hook
  const { 
    syncStatus: trainingSyncStatus, 
    refreshDashboard,
    triggerTrainingSync 
  } = useSyncOperations(async () => {
    await refetchAll();
    await refetchCompletions();
  });

  // Log completion data for debugging
  useMemo(() => {
    if (formattedCompletions && formattedCompletions.length > 0) {
      console.log(`Dashboard has ${formattedCompletions.length} completion records available`);
      console.log("Sample completion data:", formattedCompletions.slice(0, 3));
      
      // Add a log specifically for the count
      if (formattedCompletions.length >= 1000) {
        console.log(`WARNING: Large number of completions (${formattedCompletions.length}). Check if all records are being processed.`);
      }
    } else {
      console.log("No completion data available for Dashboard");
    }
    
    // Log raw completion data count for comparison
    if (trainingCompletions) {
      console.log(`Raw training completions count: ${trainingCompletions.length}`);
    }
  }, [formattedCompletions, trainingCompletions]);
  
  // Calculate statistics only when data is available and not loading
  const statistics = useMemo(() => {
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
    
    console.log("Calculated dashboard statistics:", {
      totalTrainings: stats?.totalTrainings,
      completedTrainings: stats?.completedTrainings,
      expiredTrainings: stats?.expiredTrainings,
      completionRate: stats?.completionRate?.toFixed(2) + '%',
      completionsUsed: formattedCompletions?.length
    });
    
    return stats;
  }, [
    employees, 
    trainings, 
    formattedCompletions,
    isEmployeesLoading, 
    isTrainingsLoading, 
    isTrainingCompletionsLoading,
    toast
  ]);

  // Use the training completions sync status if available, otherwise use the bamboo sync status
  const syncStatus = trainingSyncStatus || bambooSyncStatus;

  // Single loading state derived from all data sources
  const isLoading = isEmployeesLoading || isTrainingsLoading || isTrainingCompletionsLoading || 
                   !statistics;

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

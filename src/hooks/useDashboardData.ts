
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { calculateStatisticsAsync } from "@/utils/StatisticsWorker";
import useEmployeeCache from "@/hooks/useEmployeeCache";
import useTrainingCompletions from "@/hooks/cache/useTrainingCompletions";
import { supabase } from "@/integrations/supabase/client";
import type { TrainingStatistics, Training, TrainingCompletion } from "@/lib/types";
import useBambooHR from "@/hooks/useBambooHR";

/**
 * Custom hook for efficiently retrieving and processing dashboard data
 * Uses cached data from Supabase instead of direct API calls to BambooHR
 */
export function useDashboardData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bambooClient = useBambooHR();
  
  // Get cached employees and trainings
  const { 
    employees, 
    trainings, 
    isEmployeesLoading, 
    isTrainingsLoading,
    refetchAll,
    syncStatus: bambooSyncStatus
  } = useEmployeeCache();

  // Get training completions from the new database table
  const { data: trainingCompletions, isLoading: isTrainingCompletionsLoading, refetch: refetchCompletions } = useTrainingCompletions();

  // Get sync status for training completions
  const { data: trainingSyncStatus, isLoading: isTrainingSyncStatusLoading, refetch: refetchSyncStatus } = useQuery({
    queryKey: ['sync-status', 'training_completions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'training_completions')
        .single();
      
      if (error) {
        console.error("Error fetching training sync status:", error);
        return null;
      }
      
      return data;
    },
  });

  // Fetch training types directly from bamboo_training_types table as a backup
  const { data: trainingTypes, isLoading: isTrainingTypesLoading } = useQuery({
    queryKey: ['bamboo_training_types'],
    queryFn: async () => {
      console.log("Fetching training types from bamboo_training_types table");
      
      const { data, error } = await supabase
        .from('bamboo_training_types')
        .select('*');
      
      if (error) {
        console.error("Error fetching training types:", error);
        return [];
      }
      
      console.log(`Fetched ${data.length} training types`);
      
      // Map to training format for compatibility
      return data.map(type => ({
        id: type.id,
        title: type.name,
        type: type.id,
        category: type.category || 'General',
        description: type.description || '',
        durationHours: 0,
        requiredFor: []
      })) as Training[];
    },
  });

  // Fetch completions directly from BambooHR if cache is empty
  const { data: directCompletions, isLoading: isDirectCompletionsLoading } = useQuery({
    queryKey: ['bamboohr', 'direct_completions'],
    queryFn: async () => {
      // Only execute if cached completions are empty and BambooHR client is configured
      if ((trainingCompletions && trainingCompletions.length > 0) || !bambooClient.isConfigured) {
        return null;
      }
      
      console.log("Cache empty. Fetching training completions directly from BambooHR");
      try {
        // Get a small sample of employees for direct completion fetching
        const bambooCachedEmployees = employees?.slice(0, 50) || [];
        
        if (bambooCachedEmployees.length === 0) {
          console.log("No employees available to fetch completions for");
          return [];
        }
        
        console.log(`Fetching completions for ${bambooCachedEmployees.length} sample employees`);
        
        // Fetch completions for each employee
        const directCompletionPromises = bambooCachedEmployees.map(async (employee) => {
          try {
            const employeeCompletions = await bambooClient.fetchUserTrainings(employee.id);
            return employeeCompletions.map(completion => ({
              id: `${employee.id}-${completion.trainingId || completion.type}`,
              employeeId: employee.id,
              trainingId: completion.trainingId || completion.type || '',
              completionDate: completion.completionDate || completion.completed || '',
              status: 'completed' as const,
            }));
          } catch (error) {
            console.error(`Error fetching completions for employee ${employee.id}:`, error);
            return [];
          }
        });
        
        // Wait for all completions to be fetched
        const completionResults = await Promise.all(directCompletionPromises);
        const allDirectCompletions = completionResults.flat();
        
        console.log(`Fetched ${allDirectCompletions.length} completions directly from BambooHR API`);
        
        // Provide sample data if we have any
        if (allDirectCompletions.length > 0) {
          console.log("Sample direct completion:", allDirectCompletions[0]);
        }
        
        return allDirectCompletions as TrainingCompletion[];
      } catch (error) {
        console.error("Error fetching direct completions:", error);
        return [];
      }
    },
    // Only execute this query if the cached completions are empty
    enabled: (!trainingCompletions || trainingCompletions.length === 0) && bambooClient.isConfigured,
  });

  // Combine trainings from cache and training types
  const combinedTrainings = useMemo(() => {
    // If we have trainings from the cache, use those
    if (trainings && trainings.length > 0) {
      console.log("Using trainings from cache:", trainings.length);
      return trainings;
    }
    
    // Otherwise, if we have training types, use those
    if (trainingTypes && trainingTypes.length > 0) {
      console.log("Using training types as fallback:", trainingTypes.length);
      return trainingTypes;
    }
    
    // If we have neither, return an empty array
    console.log("No trainings or training types available");
    return [];
  }, [trainings, trainingTypes]);

  // Combine completions from database and direct BambooHR fetch
  const combinedCompletions = useMemo(() => {
    if (trainingCompletions && trainingCompletions.length > 0) {
      console.log(`Using ${trainingCompletions.length} completions from database`);
      return trainingCompletions;
    }
    
    if (directCompletions && directCompletions.length > 0) {
      console.log(`Using ${directCompletions.length} directly fetched completions`);
      return directCompletions;
    }
    
    console.log("No completion data available from any source");
    return [];
  }, [trainingCompletions, directCompletions]);

  // Log completion data for debugging
  useMemo(() => {
    if (combinedCompletions && combinedCompletions.length > 0) {
      console.log(`Dashboard has ${combinedCompletions.length} completion records available`);
      console.log("Sample completion data:", combinedCompletions.slice(0, 3));
    } else {
      console.log("No completion data available for Dashboard");
    }
  }, [combinedCompletions]);
  
  // Calculate statistics only when data is available and not loading
  // Use memoization to avoid recalculating unnecessarily
  const statistics = useMemo(() => {
    const isLoading = isEmployeesLoading || isTrainingsLoading || isTrainingCompletionsLoading || 
                     isTrainingTypesLoading || isDirectCompletionsLoading;
                     
    if (isLoading) {
      console.log("Still loading data, deferring statistics calculation");
      return null;
    }

    const effectiveEmployees = employees?.length ? employees : [];
    const effectiveTrainings = combinedTrainings?.length ? combinedTrainings : [];
    const effectiveCompletions = combinedCompletions?.length ? combinedCompletions : [];
    
    if ((!effectiveEmployees.length || !effectiveTrainings.length) && !trainingTypes?.length) {
      console.log("Missing required data for statistics calculation:", {
        employeesCount: effectiveEmployees.length || 0,
        trainingsCount: effectiveTrainings.length || 0,
        trainingTypesCount: trainingTypes?.length || 0,
        completionsCount: effectiveCompletions.length || 0
      });
      return null;
    }

    try {
      console.log("Calculating dashboard statistics with:", {
        employeesCount: effectiveEmployees.length,
        trainingsCount: effectiveTrainings.length,
        trainingTypesCount: trainingTypes?.length || 0,
        completionsCount: effectiveCompletions.length
      });
      
      return calculateStatisticsAsync(
        effectiveEmployees, 
        effectiveTrainings, 
        effectiveCompletions
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
  }, [
    employees, 
    combinedTrainings, 
    combinedCompletions, 
    trainingTypes,
    isEmployeesLoading, 
    isTrainingsLoading, 
    isTrainingCompletionsLoading, 
    isTrainingTypesLoading, 
    isDirectCompletionsLoading,
    toast
  ]);

  // Use the training completions sync status if available, otherwise use the bamboo sync status
  const syncStatus = trainingSyncStatus || bambooSyncStatus;

  // Single loading state derived from all data sources
  const isLoading = isEmployeesLoading || isTrainingsLoading || isTrainingCompletionsLoading || 
                   isTrainingTypesLoading || isDirectCompletionsLoading || !statistics;

  // Function to manually trigger a full data refresh
  const refreshDashboard = async () => {
    try {
      console.log("Manually refreshing dashboard data...");
      await refetchAll();
      await refetchCompletions();
      await refetchSyncStatus();
      
      // Invalidate any prefetch query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'prefetch'] });
      queryClient.invalidateQueries({ queryKey: ['bamboo_training_types'] });
      queryClient.invalidateQueries({ queryKey: ['bamboohr', 'direct_completions'] });
      
      toast({
        title: "Refresh initiated",
        description: "Dashboard data is being refreshed...",
      });
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh dashboard data",
        variant: "destructive"
      });
    }
  };

  // Function to trigger a full training completions sync
  const triggerTrainingSync = async () => {
    try {
      console.log("Triggering training completions sync...");
      
      const { data, error } = await supabase.rpc('trigger_training_completions_sync');
      
      if (error) {
        throw new Error(`Failed to trigger sync: ${error.message}`);
      }
      
      toast({
        title: "Sync started",
        description: "Training completions sync has been initiated. This may take several minutes.",
      });
      
      // Start polling for sync status
      const intervalId = setInterval(async () => {
        await refetchSyncStatus();
      }, 5000); // Check every 5 seconds
      
      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(intervalId);
        refreshDashboard(); // Final refresh after timeout
      }, 120000);
      
      return true;
    } catch (error) {
      console.error("Error triggering training sync:", error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to start training sync",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    // Data
    employees,
    trainings: combinedTrainings,
    completions: combinedCompletions,
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

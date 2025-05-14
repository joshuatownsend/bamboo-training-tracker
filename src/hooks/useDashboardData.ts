import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { calculateStatisticsAsync } from "@/utils/StatisticsWorker";
import useEmployeeCache from "@/hooks/useEmployeeCache";
import { supabase } from "@/integrations/supabase/client";
import type { TrainingStatistics, Training, TrainingCompletion } from "@/lib/types";
import useBambooHR from "@/hooks/useBambooHR";
import { useCompletionsCache } from "@/hooks/cache";

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

  // Get training completions using our fixed cache hook
  const { data: trainingCompletions, isLoading: isTrainingCompletionsLoading, refetch: refetchCompletions } = useCompletionsCache();

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

  // Prepare the completions data in the format our components expect
  const formattedCompletions = useMemo(() => {
    if (!trainingCompletions || trainingCompletions.length === 0) {
      console.log("No training completions available for dashboard");
      return [];
    }
    
    console.log(`Formatting ${trainingCompletions.length} completions for dashboard use`);
    
    // Format the completions to match our TrainingCompletion type
    return trainingCompletions.map(completion => {
      // Make sure we're handling both v1 and v2 table formats
      // employee_training_completions_2 has snake_case fields
      return {
        id: `${completion.employee_id}-${completion.training_id}-${completion.completed || completion.completion_date}`,
        employeeId: completion.employee_id.toString(),
        trainingId: completion.training_id.toString(),
        completionDate: completion.completed || completion.completion_date,
        status: 'completed' as const,
        instructor: completion.instructor,
        notes: completion.notes
      } as TrainingCompletion;
    });
  }, [trainingCompletions]);

  // Log completion data for debugging
  useMemo(() => {
    if (formattedCompletions && formattedCompletions.length > 0) {
      console.log(`Dashboard has ${formattedCompletions.length} completion records available`);
      console.log("Sample completion data:", formattedCompletions.slice(0, 3));
    } else {
      console.log("No completion data available for Dashboard");
    }
  }, [formattedCompletions]);
  
  // Calculate statistics only when data is available and not loading
  // Use memoization to avoid recalculating unnecessarily
  const statistics = useMemo(() => {
    const isLoading = isEmployeesLoading || isTrainingsLoading || isTrainingCompletionsLoading || 
                     isTrainingTypesLoading;
                     
    if (isLoading) {
      console.log("Still loading data, deferring statistics calculation");
      return null;
    }

    const effectiveEmployees = employees?.length ? employees : [];
    const effectiveTrainings = combinedTrainings?.length ? combinedTrainings : [];
    const effectiveCompletions = formattedCompletions?.length ? formattedCompletions : [];
    
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
    formattedCompletions, 
    trainingTypes,
    isEmployeesLoading, 
    isTrainingsLoading, 
    isTrainingCompletionsLoading, 
    isTrainingTypesLoading,
    toast
  ]);

  // Use the training completions sync status if available, otherwise use the bamboo sync status
  const syncStatus = trainingSyncStatus || bambooSyncStatus;

  // Single loading state derived from all data sources
  const isLoading = isEmployeesLoading || isTrainingsLoading || isTrainingCompletionsLoading || 
                   isTrainingTypesLoading || !statistics;

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


import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { calculateStatisticsAsync } from "@/utils/StatisticsWorker";
import useEmployeeCache from "@/hooks/useEmployeeCache";
import { supabase } from "@/integrations/supabase/client";
import type { TrainingStatistics, Training } from "@/lib/types";

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

  // Log completion data for debugging
  useMemo(() => {
    if (completions && completions.length > 0) {
      console.log(`Dashboard has ${completions.length} completion records available`);
      console.log("Sample completion data:", completions.slice(0, 3));
    } else {
      console.log("No completion data available for Dashboard");
    }
  }, [completions]);
  
  // Calculate statistics only when data is available and not loading
  // Use memoization to avoid recalculating unnecessarily
  const statistics = useMemo(() => {
    if (isEmployeesLoading || isTrainingsLoading || isCompletionsLoading || isTrainingTypesLoading) {
      return null;
    }

    const effectiveEmployees = employees?.length ? employees : [];
    const effectiveTrainings = combinedTrainings?.length ? combinedTrainings : [];
    const effectiveCompletions = completions || [];
    
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
      console.log("Calculating dashboard statistics from cache...", {
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
    completions, 
    trainingTypes,
    isEmployeesLoading, 
    isTrainingsLoading, 
    isCompletionsLoading, 
    isTrainingTypesLoading, 
    toast
  ]);

  // Single loading state derived from all data sources
  const isLoading = isEmployeesLoading || isTrainingsLoading || isCompletionsLoading || isTrainingTypesLoading || !statistics;

  // Function to manually trigger refresh
  const refreshDashboard = async () => {
    try {
      console.log("Manually refreshing dashboard data...");
      await refetchAll();
      
      // Invalidate any prefetch query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'prefetch'] });
      queryClient.invalidateQueries({ queryKey: ['bamboo_training_types'] });
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
    trainings: combinedTrainings,
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

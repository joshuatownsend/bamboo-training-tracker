import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Training } from "@/lib/types";

/**
 * Hook to get training data for dashboard
 */
export function useTrainingData() {
  const { data: trainings, isLoading: isTrainingsLoading } = useQuery({
    queryKey: ['cached', 'trainings'],
    queryFn: async () => {
      console.log("Fetching trainings from cached data");
      // Implementation from cache hook
      const { data, error } = await supabase
        .from('employee_training_completions_2')
        .select('*');
      
      if (error) {
        console.error("Error fetching trainings from cache:", error);
        return [];
      }
      
      return data;
    }
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
  
  return {
    trainings: combinedTrainings,
    isLoading: isTrainingsLoading || isTrainingTypesLoading,
    trainingTypes
  };
}

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Training } from "@/lib/types";

/**
 * Hook to get training data for dashboard
 */
export function useTrainingData() {
  const { data: rawTrainings, isLoading: isTrainingsLoading } = useQuery({
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

  // Map raw trainings to proper Training type
  const mappedRawTrainings = useMemo(() => {
    if (!rawTrainings || rawTrainings.length === 0) return [];
    
    // Map the raw database data to the Training type
    return rawTrainings.map(item => ({
      id: String(item.training_id),
      title: `Training ${item.training_id}`,  // Use a placeholder title
      type: String(item.training_id),
      category: 'General',
      description: '',
      durationHours: 0,
      requiredFor: []
    } as Training));
  }, [rawTrainings]);

  // Combine trainings from cache and training types
  const combinedTrainings = useMemo(() => {
    // If we have training types, prioritize those
    if (trainingTypes && trainingTypes.length > 0) {
      console.log("Using training types:", trainingTypes.length);
      return trainingTypes;
    }
    
    // Otherwise, if we have mapped raw trainings, use those
    if (mappedRawTrainings.length > 0) {
      console.log("Using mapped raw trainings:", mappedRawTrainings.length);
      return mappedRawTrainings;
    }
    
    // If we have neither, return an empty array
    console.log("No trainings or training types available");
    return [] as Training[];
  }, [trainingTypes, mappedRawTrainings]);
  
  return {
    trainings: combinedTrainings,
    isLoading: isTrainingsLoading || isTrainingTypesLoading,
    trainingTypes
  };
}


import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user";
import { CachedCompletion } from "@/types/bamboo";
import { Training, TrainingType } from "@/lib/types";

// Function to fetch training data from Supabase
export const useTrainingData = (employeeId?: string) => {
  const { currentUser } = useUser();
  
  const trainingCompletionsQuery = useQuery({
    queryKey: ['trainings', employeeId || currentUser?.id],
    queryFn: async () => {
      const targetEmployeeId = employeeId || currentUser?.employeeId;
      
      if (!targetEmployeeId) {
        return [];
      }
      
      // Get training completions from cached data
      const { data, error } = await supabase
        .from('cached_training_completions')
        .select('*')
        .eq('employee_id', targetEmployeeId);
        
      if (error) {
        console.error('Error fetching training data:', error);
        throw new Error(`Failed to fetch training data: ${error.message}`);
      }
      
      return data as CachedCompletion[];
    },
    enabled: !!(employeeId || currentUser?.employeeId),
  });

  // Add a query to fetch training types
  const trainingTypesQuery = useQuery({
    queryKey: ['trainingTypes'],
    queryFn: async () => {
      // Using the correct table name: bamboo_training_types instead of training_types
      const { data, error } = await supabase
        .from('bamboo_training_types')
        .select('*');
        
      if (error) {
        console.error('Error fetching training types:', error);
        throw new Error(`Failed to fetch training types: ${error.message}`);
      }
      
      // Transform the bamboo_training_types data to match the TrainingType interface
      const formattedData: TrainingType[] = data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category || undefined,
        description: item.description || undefined
      }));
      
      return formattedData;
    }
  });

  return {
    userCompletedTrainings: trainingCompletionsQuery.data || [],
    trainingTypes: trainingTypesQuery.data || [],
    isLoadingTrainings: trainingCompletionsQuery.isLoading,
    isLoadingTrainingTypes: trainingTypesQuery.isLoading,
    trainingsError: trainingCompletionsQuery.error || trainingTypesQuery.error,
    ...trainingCompletionsQuery // Include original query properties for backward compatibility
  };
};

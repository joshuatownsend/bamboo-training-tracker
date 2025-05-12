
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/user";
import { supabase } from "@/integrations/supabase/client";
import { Training, TrainingCompletion } from "@/lib/types";

export function useTrainingData() {
  const { currentUser } = useUser();

  // Fetch user's completed trainings
  const {
    data: userCompletedTrainings = [],
    isLoading: isLoadingTrainings,
    error: trainingsError
  } = useQuery({
    queryKey: ['user-trainings', currentUser?.employee_id],
    queryFn: async () => {
      if (!currentUser?.employee_id) {
        console.log('No employee_id found for current user');
        return [];
      }
      
      const { data, error } = await supabase
        .from('cached_training_completions')
        .select('*')
        .eq('employee_id', currentUser.employee_id);
      
      if (error) {
        console.error("Error fetching user trainings:", error);
        throw error;
      }
      
      return data.map(completion => ({
        id: completion.id || `completion-${completion.employee_id}-${completion.training_id}`,
        employee_id: completion.employee_id,
        training_id: completion.training_id,
        completion_date: completion.completion_date || '',
        expiration_date: completion.expiration_date || undefined,
        status: completion.status || 'completed',
        score: completion.score,
        certificate_url: completion.certificate_url
      })) as TrainingCompletion[];
    },
    enabled: !!currentUser?.employee_id
  });

  // Fetch all training types
  const {
    data: trainingTypes = [],
    isLoading: isLoadingTrainingTypes,
    error: trainingTypesError
  } = useQuery({
    queryKey: ['training-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cached_trainings')
        .select('*');
      
      if (error) {
        console.error("Error fetching training types:", error);
        throw error;
      }
      
      return data.map(training => ({
        id: training.id,
        title: training.title,
        type: training.type,
        category: training.category,
        description: training.description,
        duration_hours: training.duration_hours,
        required_for: training.required_for || []
      })) as Training[];
    },
    enabled: !!currentUser
  });

  return {
    userCompletedTrainings,
    trainingTypes,
    isLoadingTrainings,
    isLoadingTrainingTypes,
    trainingsError: trainingsError || trainingTypesError
  };
}

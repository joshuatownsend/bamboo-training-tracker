
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/user";
import { Training, TrainingCompletion } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useTrainingData() {
  const { currentUser } = useUser();
  const { toast } = useToast();

  // Fetch user's trainings from BambooHR
  const {
    data: userTrainings = [],
    isLoading: isLoadingTrainings,
    error: trainingsError
  } = useQuery({
    queryKey: ['trainings', currentUser?.employeeId],
    queryFn: async () => {
      if (!currentUser?.employeeId) {
        throw new Error("No employee ID available");
      }

      const bamboo = new (await import('@/lib/bamboohr/api')).default({
        subdomain: 'avfrd',
        apiKey: '',
        useEdgeFunction: true,
        edgeFunctionUrl: import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
      });
      
      try {
        const result = await bamboo.getUserTrainings(currentUser.employeeId);
        console.log("Fetched user trainings:", result);
        return result || [];
      } catch (err) {
        console.error("Error fetching training data:", err);
        throw err;
      }
    },
    enabled: !!currentUser?.employeeId
  });

  // Fetch all training types from Supabase
  const {
    data: trainingTypes = [],
    isLoading: isLoadingTrainingTypes
  } = useQuery({
    queryKey: ['training-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bamboo_training_types')
        .select('*');
      
      if (error) {
        console.error("Error fetching training types:", error);
        throw error;
      }
      
      // Map the data to match the Training type
      return data.map(item => ({
        id: item.id,
        title: item.name,
        type: item.category || 'unknown',
        category: item.category || 'uncategorized',
        description: item.description || '',
        durationHours: 0, // Default value as it's not in the database
        requiredFor: [] // Default value as it's not in the database
      })) as Training[];
    },
    enabled: !!currentUser
  });

  // Process training completions once we have the data
  const userCompletedTrainings: TrainingCompletion[] = userTrainings.map(training => ({
    id: training.id,
    employeeId: currentUser?.employeeId || '',
    trainingId: training.trainingId || training.type?.toString() || '',
    completionDate: training.completionDate,
    status: 'completed' as const
  }));

  return {
    userCompletedTrainings,
    trainingTypes,
    isLoadingTrainings,
    isLoadingTrainingTypes,
    trainingsError
  };
}

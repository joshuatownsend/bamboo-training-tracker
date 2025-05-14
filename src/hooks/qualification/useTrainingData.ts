
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user";
import { UserTraining, Training } from "@/lib/types";

/**
 * Hook to fetch user training data from BambooHR via Supabase
 */
export const useTrainingData = (employeeId?: string) => {
  const { currentUser } = useUser();
  
  // Use provided employeeId or fall back to currentUser's employeeId
  const targetEmployeeId = employeeId || currentUser?.bambooEmployeeId || currentUser?.employeeId;
  
  const { data: trainings, isLoading, error } = useQuery({
    queryKey: ['trainings', targetEmployeeId],
    queryFn: async () => {
      if (!targetEmployeeId) {
        console.warn("No employee ID provided for training data fetch");
        return [];
      }
      
      console.log(`Fetching trainings for employee ID: ${targetEmployeeId}`);
      
      // Join training completions with training types to get full details
      const { data, error } = await supabase
        .from('employee_training_completions_2')
        .select(`
          *,
          training:bamboo_training_types!training_id(
            id,
            name,
            description,
            category
          )
        `)
        .eq('employee_id', targetEmployeeId)
        .order('completed', { ascending: false });
        
      if (error) {
        console.error("Error fetching training data:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log(`No training data found for employee ID: ${targetEmployeeId}`);
        return [];
      }
      
      console.log(`Found ${data.length} trainings for employee ID: ${targetEmployeeId}`);
      
      // Convert to UserTraining format
      return data.map((item): UserTraining => {
        const trainingDetails: Training | null = item.training ? {
          id: String(item.training.id),
          title: item.training.name,
          type: String(item.training_id),
          category: item.training.category || 'Uncategorized',
          description: item.training.description || '',
          durationHours: 0,
          requiredFor: []
        } : null;
        
        return {
          id: `${item.employee_id}-${item.training_id}-${item.completed}`,
          employeeId: String(item.employee_id),
          trainingId: String(item.training_id),
          completionDate: item.completed,
          instructor: item.instructor,
          notes: item.notes,
          type: String(item.training_id),
          completed: item.completed,
          trainingDetails
        };
      });
    },
    enabled: !!targetEmployeeId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  return { trainings, isLoading, error };
};

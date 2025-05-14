
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user";
import { UserTraining, Training } from "@/lib/types";
import { CompletionJoinedRow } from "@/lib/dbTypes";
import { toStringId } from "@/utils/idConverters";
import { mapToUserTraining } from "@/lib/rowMappers";

/**
 * Hook to fetch user training data from BambooHR via Supabase
 */
export const useTrainingData = (employeeId?: string) => {
  const { currentUser } = useUser();
  
  // Use provided employeeId or fall back to currentUser's employeeId
  const targetEmployeeId = employeeId || currentUser?.bambooEmployeeId || currentUser?.employeeId;
  
  const trainingsQuery = useQuery({
    queryKey: ['trainings', targetEmployeeId],
    queryFn: async () => {
      if (!targetEmployeeId) {
        console.warn("No employee ID provided for training data fetch");
        return [];
      }
      
      console.log(`Fetching trainings for employee ID: ${targetEmployeeId}`);
      
      // Convert string ID to number for database query
      const employeeIdNumber = parseInt(targetEmployeeId, 10);
      
      if (isNaN(employeeIdNumber)) {
        console.error(`Invalid employee ID: ${targetEmployeeId} is not a number`);
        return [];
      }
      
      // Fetch training completions with a simpler query to avoid foreign key issues
      const { data: completionsData, error: completionsError } = await supabase
        .from('employee_training_completions_2')
        .select('*')
        .eq('employee_id', employeeIdNumber)
        .order('completed', { ascending: false });
        
      if (completionsError) {
        console.error("Error fetching training completions:", completionsError);
        throw completionsError;
      }

      console.log(`Found ${completionsData?.length || 0} training completions`);
      
      // Now, fetch the training types separately
      const trainingIds = completionsData?.map(completion => completion.training_id) || [];
      
      // Only fetch training types if we have completions
      if (trainingIds.length === 0) {
        console.log("No training completions found");
        return [];
      }
      
      const { data: trainingTypesData, error: trainingTypesError } = await supabase
        .from('bamboo_training_types')
        .select('*')
        .in('id', trainingIds);
        
      if (trainingTypesError) {
        console.error("Error fetching training types:", trainingTypesError);
        // Continue anyway, we'll just use placeholders for training details
      }
      
      // Create a map for easy lookup
      const trainingTypesMap = new Map();
      if (trainingTypesData) {
        trainingTypesData.forEach(type => {
          trainingTypesMap.set(type.id, type);
        });
      }
      
      // Join the data manually
      const joinedData = completionsData?.map(completion => {
        const trainingType = trainingTypesMap.get(completion.training_id);
        
        // Create a joined structure that matches what we expect
        const joinedRow = {
          ...completion,
          training: trainingType || {
            id: completion.training_id,
            name: `Training ${completion.training_id}`,
            category: "Unknown",
            description: null
          }
        };
        
        return mapToUserTraining(joinedRow as unknown as CompletionJoinedRow);
      }) || [];
      
      console.log(`Mapped ${joinedData.length} training completions with details`);
      return joinedData;
    },
    enabled: !!targetEmployeeId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  return { 
    trainings: trainingsQuery.data || [], 
    isLoading: trainingsQuery.isLoading, 
    error: trainingsQuery.error as Error 
  };
};

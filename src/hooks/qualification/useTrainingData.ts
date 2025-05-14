
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
        .eq('employee_id', employeeIdNumber)
        .order('completed', { ascending: false });
        
      if (error) {
        console.error("Error fetching training data:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log(`No training data found for employee ID: ${employeeIdNumber}`);
        return [];
      }
      
      console.log(`Found ${data.length} trainings for employee ID: ${employeeIdNumber}`);
      
      // Convert the data to the expected type and then map to UserTraining format
      return (data as unknown as CompletionJoinedRow[]).map(mapToUserTraining);
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

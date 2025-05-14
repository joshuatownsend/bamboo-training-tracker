
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserTraining } from "@/lib/types";

/**
 * Hook to fetch all training completions for the current user from the database
 */
export function useTrainingData(employeeId?: string) {
  return useQuery({
    queryKey: ['training-data', employeeId],
    queryFn: async () => {
      if (!employeeId) {
        console.log("No employee ID provided to useTrainingData");
        return [];
      }

      console.log(`Fetching training data for employee ${employeeId}`);
      
      // First try the new employee_training_completions_2 table
      const { data: newData, error: newError } = await supabase
        .from('employee_training_completions_2')
        .select('*')
        .eq('employee_id', parseInt(employeeId));
      
      // If we have data in the new table, use that
      if (newData && newData.length > 0) {
        console.log(`Found ${newData.length} training completions in new table for employee ${employeeId}`);
        
        return newData.map((completion): UserTraining => ({
          id: `${completion.employee_id}-${completion.training_id}-${completion.completed}`,
          employeeId: completion.employee_id.toString(),
          trainingId: completion.training_id.toString(),
          completionDate: completion.completed,
          instructor: completion.instructor,
          notes: completion.notes,
          trainingDetails: null  // Required by UserTraining type
        }));
      }
      
      // If no data in the new table or there was an error, fall back to old table
      if (newError) {
        console.warn("Error fetching from new training completions table:", newError);
      }
      
      // Try the legacy employee_training_completions table as fallback
      const { data: legacyData, error: legacyError } = await supabase
        .from('employee_training_completions')
        .select('*')
        .eq('employee_id', parseInt(employeeId));
      
      if (legacyError) {
        console.error("Error fetching training completions:", legacyError);
        return [];
      }
      
      if (legacyData && legacyData.length > 0) {
        console.log(`Found ${legacyData.length} training completions in legacy table for employee ${employeeId}`);
        
        return legacyData.map((completion): UserTraining => ({
          id: completion.id,
          employeeId: completion.employee_id.toString(),
          trainingId: completion.training_id.toString(),
          completionDate: completion.completion_date,
          notes: completion.notes,
          instructor: completion.instructor,
          trainingDetails: null  // Required by UserTraining type
        }));
      }
      
      // If we get here, no data was found in either table
      console.log(`No training completions found for employee ${employeeId}`);
      return [];
    },
    enabled: !!employeeId,
  });
}

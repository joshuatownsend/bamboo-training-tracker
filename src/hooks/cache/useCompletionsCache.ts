
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCompletion } from "@/lib/types";

/**
 * Hook to fetch training completions from the employee_training_completions_2 table
 * Updated to ensure we retrieve all training completions without limit
 */
export function useCompletionsCache() {
  return useQuery({
    queryKey: ['cached', 'completions'],
    queryFn: async () => {
      console.log("Fetching training completions from employee_training_completions_2 table");
      
      // Try fetching from the employee_training_completions_2 table 
      // with explicit count of records for debugging
      const { count: totalCount, error: countError } = await supabase
        .from('employee_training_completions_2')
        .select('*', { count: 'exact', head: true });
      
      if (totalCount) {
        console.log(`Database contains approximately ${totalCount} training completions`);
      }
      
      if (countError) {
        console.warn("Error getting count:", countError);
      }
      
      // Now fetch all the data (no limit)
      const { data: newData, error: newError } = await supabase
        .from('employee_training_completions_2')
        .select('*');
      
      if (newData && newData.length > 0) {
        console.log(`Fetched ${newData.length} training completions from employee_training_completions_2 table`);
        
        // Map the data to our TrainingCompletion type
        return newData.map((completion): TrainingCompletion => ({
          id: `${completion.employee_id}-${completion.training_id}-${completion.completed}`,
          employeeId: completion.employee_id.toString(),
          trainingId: completion.training_id.toString(),
          completionDate: completion.completed,
          status: 'completed' as const,
          instructor: completion.instructor,
          notes: completion.notes
        }));
      }
      
      if (newError) {
        console.warn("Error fetching from employee_training_completions_2 table:", newError);
      }
      
      // Try the legacy employee_training_completions table as fallback
      const { data: legacyData, error: legacyError } = await supabase
        .from('employee_training_completions')
        .select('*');
      
      if (legacyData && legacyData.length > 0) {
        console.log(`Fetched ${legacyData.length} training completions from legacy employee_training_completions table`);
        
        return legacyData.map((completion): TrainingCompletion => ({
          id: completion.id,
          employeeId: completion.employee_id.toString(),
          trainingId: completion.training_id.toString(),
          completionDate: completion.completion_date,
          status: 'completed' as const,
          instructor: completion.instructor,
          notes: completion.notes
        }));
      }
      
      if (legacyError) {
        console.error("Error fetching from legacy employee_training_completions:", legacyError);
      }
      
      // If both tables failed or had no data, return empty array
      console.log("No training completions found in any table");
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

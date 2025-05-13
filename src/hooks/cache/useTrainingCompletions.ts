
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCompletion } from "@/lib/types";

/**
 * Hook to fetch training completions from the new database table
 */
export function useTrainingCompletions() {
  return useQuery({
    queryKey: ['training_completions'],
    queryFn: async () => {
      console.log("Fetching training completions from database");
      
      const { data, error } = await supabase
        .from('employee_training_completions')
        .select('*');
      
      if (error) {
        console.error("Error fetching training completions:", error);
        return [];
      }
      
      console.log(`Fetched ${data.length} training completions`);
      
      // Map database records to our TrainingCompletion type
      return data.map((completion): TrainingCompletion => ({
        id: completion.id,
        employeeId: completion.employee_id.toString(),
        trainingId: completion.training_id.toString(),
        completionDate: completion.completion_date,
        status: 'completed' as const,
        notes: completion.notes,
        instructor: completion.instructor
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export default useTrainingCompletions;

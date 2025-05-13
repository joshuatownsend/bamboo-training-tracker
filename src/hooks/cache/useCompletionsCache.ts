
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCompletion } from "@/lib/types";

/**
 * Hook to fetch cached training completions from Supabase
 */
export function useCompletionsCache() {
  return useQuery({
    queryKey: ['cached', 'completions'],
    queryFn: async () => {
      console.log("Fetching cached training completions from Supabase");
      
      const { data, error } = await supabase
        .from('cached_training_completions')
        .select('*');
      
      if (error) {
        console.error("Error fetching cached training completions:", error);
        return [];
      }
      
      console.log(`Fetched ${data.length} cached training completions`);
      
      // Map Supabase data to our TrainingCompletion type
      return data.map((completion): TrainingCompletion => ({
        id: completion.id,
        employeeId: completion.employee_id,
        trainingId: completion.type, // Updated to match the new schema
        completionDate: completion.completed, // Updated to match the new schema
        expirationDate: completion.expiration_date,
        status: completion.status as any,
        instructor: completion.instructor,
        notes: completion.notes
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

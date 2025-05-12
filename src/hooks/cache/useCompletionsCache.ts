
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
        employee_id: completion.employee_id,
        training_id: completion.training_id,
        completion_date: completion.completion_date,
        expiration_date: completion.expiration_date,
        status: completion.status as any,
        score: completion.score,
        certificate_url: completion.certificate_url
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

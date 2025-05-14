
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Training } from "@/lib/types";

export function useTrainingTypes() {
  return useQuery({
    queryKey: ['training-types'],
    queryFn: async () => {
      console.log("Fetching training types...");
      
      const { data, error } = await supabase
        .from('bamboo_training_types')
        .select('*');
      
      if (error) {
        console.error("Error fetching training types:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} training types`);
      
      // Create a map of training ID to training details
      const trainingMap = new Map(data.map(training => [
        String(training.id),
        {
          id: String(training.id),
          title: training.name,
          type: String(training.id),
          category: training.category || 'Unknown',
          description: training.description || '',
          durationHours: 0,
          requiredFor: []
        }
      ]));
      
      return trainingMap;
    },
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });
}

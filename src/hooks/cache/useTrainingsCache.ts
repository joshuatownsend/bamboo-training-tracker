
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Training } from "@/lib/types";

/**
 * Hook to fetch training types from the bamboo_training_types table
 */
export function useTrainingsCache() {
  return useQuery({
    queryKey: ['cached', 'trainings'],
    queryFn: async () => {
      console.log("Fetching training types from bamboo_training_types table");
      
      const { data, error } = await supabase
        .from('bamboo_training_types')
        .select('*')
        .order('name');
      
      if (error) {
        console.error("Error fetching training types:", error);
        return [];
      }
      
      console.log(`Fetched ${data.length} training types`);
      
      // Map Supabase data to our Training type
      return data.map((training): Training => ({
        id: training.id,
        title: training.name,
        type: training.id,
        category: training.category || '',
        description: training.description || '',
        durationHours: 0, // This field may not be available in the data
        requiredFor: [] // This field may not be available in the data
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

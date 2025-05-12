
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Training } from "@/lib/types";

/**
 * Hook to fetch cached trainings from Supabase
 */
export function useTrainingsCache() {
  return useQuery({
    queryKey: ['cached', 'trainings'],
    queryFn: async () => {
      console.log("Fetching cached trainings from Supabase");
      
      const { data, error } = await supabase
        .from('cached_trainings')
        .select('*')
        .order('title');
      
      if (error) {
        console.error("Error fetching cached trainings:", error);
        return [];
      }
      
      console.log(`Fetched ${data.length} cached trainings`);
      
      // Map Supabase data to our Training type
      return data.map((training): Training => ({
        id: training.id,
        title: training.title,
        type: training.type,
        category: training.category,
        description: training.description || '',
        durationHours: training.duration_hours || 0,
        requiredFor: training.required_for || []
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

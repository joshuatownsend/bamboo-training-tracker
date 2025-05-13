
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user";
import { CachedCompletion } from "@/types/bamboo";

// Function to fetch training data from Supabase
export const useTrainingData = (employeeId?: string) => {
  const { currentUser } = useUser();
  
  return useQuery({
    queryKey: ['trainings', employeeId || currentUser?.id],
    queryFn: async () => {
      const targetEmployeeId = employeeId || currentUser?.bambooEmployeeId;
      
      if (!targetEmployeeId) {
        return [];
      }
      
      // Get training completions from cached data
      const { data, error } = await supabase
        .from('cached_training_completions')
        .select('*')
        .eq('employee_id', targetEmployeeId);
        
      if (error) {
        console.error('Error fetching training data:', error);
        throw new Error(`Failed to fetch training data: ${error.message}`);
      }
      
      return data as CachedCompletion[];
    },
    enabled: !!(employeeId || currentUser?.bambooEmployeeId),
  });
};

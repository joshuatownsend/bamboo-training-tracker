
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
      console.log("Fetching training completions from both new and cached tables");
      
      // Try fetching from the new employee_training_completions_2 table first
      const { data: newData, error: newError } = await supabase
        .from('employee_training_completions_2')
        .select('*');
      
      if (newData && newData.length > 0) {
        console.log(`Fetched ${newData.length} training completions from new table`);
        
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
        console.warn("Error fetching from new training completions table:", newError);
      }
      
      // Try the legacy employee_training_completions table as fallback
      const { data: legacyData, error: legacyError } = await supabase
        .from('employee_training_completions')
        .select('*');
      
      if (legacyData && legacyData.length > 0) {
        console.log(`Fetched ${legacyData.length} training completions from legacy table`);
        
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
        console.error("Error fetching legacy training completions:", legacyError);
      }
      
      // If both tables failed or had no data, try the cached_training_completions as the final fallback
      const { data, error } = await supabase
        .from('cached_training_completions')
        .select('*');
      
      if (error) {
        console.error("Error fetching cached training completions:", error);
        return [];
      }
      
      console.log(`Fetched ${data?.length || 0} cached training completions`);
      
      // Map Supabase data to our TrainingCompletion type
      return (data || []).map((completion): TrainingCompletion => ({
        id: completion.id || `${completion.employee_id}-${completion.type}`,
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


import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCompletion } from "@/lib/types";
import { CompletionJoinedRow } from "@/lib/dbTypes";
import { mapToTrainingCompletion } from "@/lib/rowMappers";

interface UseCompletionsCacheOptions {
  limit?: number;
  countOnly?: boolean;
}

/**
 * Hook to fetch training completions with employee and training details
 * Returns a joined dataset to avoid frontend matching issues
 */
export function useCompletionsCache(options: UseCompletionsCacheOptions = {}) {
  const { limit = 100, countOnly = false } = options;

  return useQuery({
    queryKey: ['cached', 'completions', { limit, countOnly }],
    queryFn: async () => {
      // If we only need the count, use an optimized query
      if (countOnly) {
        console.log("Fetching training completions count only");
        const { count, error } = await supabase
          .from('employee_training_completions_2')
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.error("Error fetching completion count:", error);
          return [];
        }
        
        console.log(`Found ${count} total completions`);
        return count || 0;
      }
      
      console.log(`Fetching training completions with joined data (limit: ${limit})`);
      
      // Fetch data with a join to ensure we have all related information
      const query = supabase
        .from('employee_training_completions_2')
        .select(`
          *,
          employee:employee_mappings!employee_id(
            id,
            name,
            bamboo_employee_id,
            email
          ),
          training:bamboo_training_types!training_id(
            id,
            name,
            category
          )
        `)
        .order('completed', { ascending: false });
      
      // Apply limit if specified
      if (limit > 0) {
        query.limit(limit);
      }
      
      const { data: joinedData, error: joinError } = await query;
      
      if (joinError) {
        console.error("Error fetching joined completion data:", joinError);
      }
      
      if (joinedData && joinedData.length > 0) {
        console.log(`Fetched ${joinedData.length} joined training completions`);
        console.log("Sample joined data:", joinedData[0]);
        
        // Map to our TrainingCompletion type with the joined data
        return (joinedData as unknown as CompletionJoinedRow[]).map(mapToTrainingCompletion);
      }
      
      // If join fails, try the traditional approach as fallback
      console.warn("Joined query failed or returned no results, trying standard approach");
      const { data: completionsData, error: completionsError } = await supabase
        .from('employee_training_completions_2')
        .select('*')
        .order('completed', { ascending: false });
      
      if (limit > 0) {
        query.limit(limit);
      }
      
      if (completionsError) {
        console.error("Error fetching training completions:", completionsError);
      }
      
      if (completionsData && completionsData.length > 0) {
        console.log(`Fetched ${completionsData.length} training completions`);
        
        return completionsData.map((completion): TrainingCompletion => ({
          id: `${completion.employee_id}-${completion.training_id}-${completion.completed}`,
          employeeId: String(completion.employee_id),
          trainingId: String(completion.training_id),
          completionDate: completion.completed,
          status: 'completed' as const,
          instructor: completion.instructor ?? undefined,
          notes: completion.notes ?? undefined,
          // Include the display name from the record itself
          employeeData: {
            id: "direct",
            name: completion.display_name || "Unknown Employee",
            bamboo_employee_id: String(completion.employee_id)
          },
          // Add a basic training data object for consistency
          trainingData: {
            id: String(completion.training_id),
            name: "Training " + completion.training_id,
            category: "Unknown"
          }
        }));
      }
      
      console.log("No training completions found");
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Export hook with the dashboard stats hook to ensure it's available
export { default as useDashboardStats } from '@/hooks/dashboard/useDashboardStats';

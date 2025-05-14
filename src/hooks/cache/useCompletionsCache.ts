
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
          return 0; // Return 0 instead of empty array for count
        }
        
        console.log(`Found ${count} total completions`);
        return count || 0;
      }
      
      console.log(`Fetching training completions with joined data (limit: ${limit})`);
      
      // IMPROVED: Enhanced join query with better error handling
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

      // Log the query being performed
      console.log("Executing Supabase query for completions with joined data");
      
      // Apply limit if specified
      if (limit > 0) {
        query.limit(limit);
      }
      
      const { data: joinedData, error: joinError } = await query;
      
      if (joinError) {
        console.error("Error fetching joined completion data:", joinError);
        
        // IMPROVED: Log the error for debugging
        console.error("Join error details:", {
          error: joinError,
          message: joinError.message,
          details: joinError.details
        });
      }
      
      if (joinedData && joinedData.length > 0) {
        console.log(`Fetched ${joinedData.length} joined training completions`);
        // Log a sample of the data to help debug date issues
        console.log("Sample joined data first row:", joinedData[0]);
        console.log("Sample 'completed' field value:", joinedData[0].completed);
        
        // Map to our TrainingCompletion type with the joined data
        return (joinedData as unknown as CompletionJoinedRow[]).map(mapToTrainingCompletion);
      }
      
      // If join fails, try the traditional approach as fallback
      console.warn("Joined query failed or returned no results, trying direct approach");
      
      // IMPROVED: Direct fetch of bamboo_training_types first for more reliable name lookup
      const { data: trainingTypes } = await supabase
        .from('bamboo_training_types')
        .select('id, name, category');
      
      // Create a map for quick lookup
      const trainingMap = trainingTypes ? trainingTypes.reduce((acc, t) => {
        acc[t.id] = t;
        return acc;
      }, {} as Record<number, any>) : {};
      
      console.log(`Loaded ${Object.keys(trainingMap).length} training types for mapping`);
      
      // Now fetch the completions
      const { data: completionsData, error: completionsError } = await supabase
        .from('employee_training_completions_2')
        .select('*')
        .order('completed', { ascending: false });
      
      if (limit > 0 && completionsData) {
        completionsData.splice(limit);
      }
      
      if (completionsError) {
        console.error("Error fetching training completions:", completionsError);
      }
      
      if (completionsData && completionsData.length > 0) {
        console.log(`Fetched ${completionsData.length} training completions`);
        console.log("Sample direct completion data:", {
          employeeId: completionsData[0].employee_id,
          trainingId: completionsData[0].training_id,
          completedDate: completionsData[0].completed
        });
        
        return completionsData.map((completion): TrainingCompletion => {
          // Get the training info from our map
          const trainingInfo = trainingMap[completion.training_id];
          
          return {
            id: `${completion.employee_id}-${completion.training_id}-${completion.completed}`,
            employeeId: String(completion.employee_id),
            trainingId: String(completion.training_id),
            completionDate: completion.completed, // Ensure we use this value
            status: 'completed' as const,
            instructor: completion.instructor ?? undefined,
            notes: completion.notes ?? undefined,
            // Include the display name from the record itself
            employeeData: {
              id: "direct",
              name: completion.display_name || "Unknown Employee",
              bamboo_employee_id: String(completion.employee_id)
            },
            // IMPROVED: Add training data from our pre-fetched map
            trainingData: trainingInfo ? {
              id: String(trainingInfo.id),
              name: trainingInfo.name,
              category: trainingInfo.category || "Unknown"
            } : {
              id: String(completion.training_id),
              name: `Training ${completion.training_id}`,
              category: "Unknown"
            }
          };
        });
      }
      
      console.log("No training completions found");
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Export hook with the dashboard stats hook to ensure it's available
export { default as useDashboardStats } from '@/hooks/dashboard/useDashboardStats';

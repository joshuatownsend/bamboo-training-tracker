
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCompletion } from "@/lib/types";

/**
 * Hook to fetch training completions with employee and training details
 * Returns a joined dataset to avoid frontend matching issues
 */
export function useCompletionsCache() {
  return useQuery({
    queryKey: ['cached', 'completions'],
    queryFn: async () => {
      console.log("Fetching training completions with joined employee and training data");
      
      // Fetch data with a join to ensure we have all related information
      const { data: joinedData, error: joinError } = await supabase
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
        .order('completed', { ascending: false })
        .limit(100); // Limit to recent records
      
      if (joinError) {
        console.error("Error fetching joined completion data:", joinError);
      }
      
      if (joinedData && joinedData.length > 0) {
        console.log(`Fetched ${joinedData.length} joined training completions`);
        console.log("Sample joined data:", joinedData[0]);
        
        // Map to our TrainingCompletion type with the joined data
        return joinedData.map((record): TrainingCompletion => {
          // Handle potential errors in joined data
          // Ensure we always have valid objects for employee and training data
          
          // Safe access for employee data with null checks
          let employeeData = {
            id: "unknown",
            name: record.display_name || "Unknown Employee",
            bamboo_employee_id: record.employee_id.toString(),
            email: undefined
          };
          
          if (record.employee && 
              typeof record.employee === 'object' && 
              record.employee !== null && 
              !('error' in record.employee)) {
            employeeData = record.employee;
          }
              
          // Safe access for training data with null checks
          let trainingData = {
            id: "unknown",
            name: "Unknown Training",
            category: "Unknown"
          };
          
          if (record.training && 
              typeof record.training === 'object' && 
              record.training !== null && 
              !('error' in record.training)) {
            trainingData = record.training;
          }
            
          return {
            id: `${record.employee_id}-${record.training_id}-${record.completed}`,
            employeeId: record.employee_id.toString(),
            trainingId: record.training_id.toString(),
            completionDate: record.completed,
            status: 'completed' as const,
            instructor: record.instructor,
            notes: record.notes,
            employeeData,
            trainingData
          };
        });
      }
      
      // If join fails, try the traditional approach as fallback
      console.warn("Joined query failed or returned no results, trying standard approach");
      const { data: completionsData, error: completionsError } = await supabase
        .from('employee_training_completions_2')
        .select('*')
        .limit(100)
        .order('completed', { ascending: false });
      
      if (completionsError) {
        console.error("Error fetching training completions:", completionsError);
      }
      
      if (completionsData && completionsData.length > 0) {
        console.log(`Fetched ${completionsData.length} training completions`);
        
        return completionsData.map((completion): TrainingCompletion => ({
          id: `${completion.employee_id}-${completion.training_id}-${completion.completed}`,
          employeeId: completion.employee_id.toString(),
          trainingId: completion.training_id.toString(),
          completionDate: completion.completed,
          status: 'completed' as const,
          instructor: completion.instructor,
          notes: completion.notes,
          // Include the display name from the record itself
          employeeData: {
            id: "direct",
            name: completion.display_name || "Unknown Employee",
            bamboo_employee_id: completion.employee_id.toString()
          }
        }));
      }
      
      console.log("No training completions found");
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

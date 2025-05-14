
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCompletion } from "@/lib/types";
import { toStringId, safeProperty, hasProperty } from "@/utils/idConverters";

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
          // Default values for employee data when missing
          const defaultEmployeeData = {
            id: "unknown",
            name: record.display_name || "Unknown Employee",
            bamboo_employee_id: String(record.employee_id),
            email: undefined
          };
          
          // Process employee data with null safety
          const employeeData = hasProperty(record, 'employee') && 
                              typeof record.employee === 'object' ? 
            {
              id: safeProperty(record.employee, 'id', "unknown"),
              name: hasProperty(record.employee, 'name') && record.employee.name ? 
                String(record.employee.name) : 
                (record.display_name || "Unknown Employee"),
              bamboo_employee_id: hasProperty(record.employee, 'bamboo_employee_id') ? 
                String(record.employee.bamboo_employee_id) : 
                String(record.employee_id),
              email: hasProperty(record.employee, 'email') ? 
                record.employee.email as string | undefined : 
                undefined
            } : defaultEmployeeData;
              
          // Default values for training data when missing
          const defaultTrainingData = {
            id: String(record.training_id),
            name: "Unknown Training",
            category: "Unknown"
          };
          
          // Process training data with null safety
          const trainingData = hasProperty(record, 'training') && 
                              typeof record.training === 'object' ? 
            {
              id: hasProperty(record.training, 'id') ? 
                toStringId(record.training.id, "unknown") : 
                String(record.training_id),
              name: hasProperty(record.training, 'name') ? 
                String(record.training.name) : 
                "Unknown Training",
              category: hasProperty(record.training, 'category') ? 
                String(record.training.category) : 
                "Unknown"
            } : defaultTrainingData;
            
          return {
            id: `${record.employee_id}-${record.training_id}-${record.completed}`,
            employeeId: String(record.employee_id),
            trainingId: String(record.training_id),
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
          employeeId: String(completion.employee_id),
          trainingId: String(completion.training_id),
          completionDate: completion.completed,
          status: 'completed' as const,
          instructor: completion.instructor,
          notes: completion.notes,
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

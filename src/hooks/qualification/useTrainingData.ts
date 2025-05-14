
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to fetch training data for qualifications
 * @returns Training data query result
 */
export function useTrainingData(employeeId?: string) {
  const { currentUser } = useUser();
  
  return useQuery({
    queryKey: ['training_data', employeeId || currentUser?.id],
    queryFn: async () => {
      try {
        console.info("Fetching training data for qualifications...");
        
        // If we have a specific employee ID, use that, otherwise use the current user
        const targetEmployeeId = employeeId || 
          (currentUser?.employeeId ? currentUser.employeeId : null);
        
        if (!targetEmployeeId) {
          console.warn("No employee ID available for fetching training data");
          return [];
        }
        
        // Query the employee_training_completions_2 table which is updated by the sync process
        // Convert string ID to number if needed
        const employeeIdNum = typeof targetEmployeeId === 'string' 
          ? parseInt(targetEmployeeId, 10) 
          : targetEmployeeId;
        
        const { data, error } = await supabase
          .from('employee_training_completions_2')
          .select('*')
          .eq('employee_id', employeeIdNum);
          
        if (error) {
          console.error("Error fetching training data:", error);
          throw error;
        }
        
        console.info(`Fetched training data: ${data.length} items`);
        return data || [];
      } catch (error) {
        console.error("Exception in useTrainingData:", error);
        toast({
          title: "Error loading training data",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!currentUser || !!employeeId,
  });
}

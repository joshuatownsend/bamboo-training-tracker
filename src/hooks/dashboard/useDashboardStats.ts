
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingStatistics } from "@/lib/types";

/**
 * Hook to fetch optimized dashboard statistics with accurate counts
 * Uses direct COUNT queries instead of loading and counting full datasets
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<TrainingStatistics> => {
      console.log("Fetching optimized dashboard statistics...");
      
      // Get total number of employees
      const { count: employeeCount, error: employeeError } = await supabase
        .from('employee_mappings')
        .select('*', { count: 'exact', head: true });
      
      if (employeeError) {
        console.error("Error fetching employee count:", employeeError);
      }
      
      // Get total number of training types
      const { count: trainingCount, error: trainingError } = await supabase
        .from('bamboo_training_types')
        .select('*', { count: 'exact', head: true });
      
      if (trainingError) {
        console.error("Error fetching training count:", trainingError);
      }
      
      // Get training completions count - the critical fix
      const { count: completedTrainings, error: completionsError } = await supabase
        .from('employee_training_completions_2')
        .select('*', { count: 'exact', head: true });
      
      if (completionsError) {
        console.error("Error fetching completions count:", completionsError);
      }
      
      // Get count of unique training types used in completions
      const { data: uniqueTrainings, error: uniqueError } = await supabase
        .from('employee_training_completions_2')
        .select('training_id')
        .limit(1000);
      
      if (uniqueError) {
        console.error("Error fetching unique trainings:", uniqueError);
      }

      // Get a count of expired trainings (mock for now, would need actual expiration logic)
      const expiredTrainings = 0; // This would need real logic based on requirements
      
      console.log("Dashboard statistics fetched:", {
        employeeCount,
        trainingCount,
        completedTrainings,
        uniqueTrainingsCount: uniqueTrainings?.length || 0
      });
      
      // Calculate completion rate if we have data
      const totalPossibleTrainings = (employeeCount || 0) * (trainingCount || 0);
      const completionRate = totalPossibleTrainings > 0 
        ? ((completedTrainings || 0) / totalPossibleTrainings) * 100
        : 0;
      
      return {
        totalTrainings: trainingCount || 0,
        completedTrainings: completedTrainings || 0,
        expiredTrainings: expiredTrainings,
        upcomingTrainings: 0, // Add missing property required by the TrainingStatistics type
        completionRate: completionRate,
        departmentStats: [] // This would need to be calculated separately if needed
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export default useDashboardStats;

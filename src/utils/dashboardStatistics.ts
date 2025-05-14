
import { calculateStatisticsAsync } from "@/utils/StatisticsWorker";
import { Employee, Training, TrainingCompletion, TrainingStatistics } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

/**
 * Calculate dashboard statistics from employee, training, and completion data
 */
export const calculateDashboardStatistics = (
  employees: Employee[] | undefined,
  trainings: Training[] | undefined, 
  completions: TrainingCompletion[] | undefined,
  toast: ReturnType<typeof useToast>["toast"]
): TrainingStatistics | null => {
  try {
    const effectiveEmployees = employees?.length ? employees : [];
    const effectiveTrainings = trainings?.length ? trainings : [];
    const effectiveCompletions = completions?.length ? completions : [];
    
    if (!effectiveEmployees.length || !effectiveTrainings.length) {
      console.log("Missing required data for statistics calculation:", {
        employeesCount: effectiveEmployees.length || 0,
        trainingsCount: effectiveTrainings.length || 0,
        completionsCount: effectiveCompletions.length || 0
      });
      return null;
    }

    console.log("Calculating dashboard statistics with:", {
      employeesCount: effectiveEmployees.length,
      trainingsCount: effectiveTrainings.length,
      completionsCount: effectiveCompletions.length
    });
    
    // Make sure we're passing the full array of completions to the calculation function
    if (effectiveCompletions.length >= 1000) {
      console.log(`Processing large number of completions: ${effectiveCompletions.length}`);
    }
    
    return calculateStatisticsAsync(
      effectiveEmployees, 
      effectiveTrainings, 
      effectiveCompletions
    );
  } catch (err) {
    console.error("Error calculating dashboard statistics:", err);
    toast({
      title: "Error calculating statistics",
      description: "There was a problem processing training data",
      variant: "destructive"
    });
    return null;
  }
};


import { useMemo } from "react";
import { TrainingCompletion } from "@/lib/types";

// Define type for database training completion record
interface DbTrainingCompletion {
  employee_id: number | string;
  training_id: number | string;
  completed?: string;
  completion_date?: string;
  instructor?: string;
  notes?: string;
  [key: string]: any; // For other potential fields
}

/**
 * Hook to format completion data for dashboard
 */
export function useCompletionFormatting(completions: any[] | undefined) {
  // Prepare the completions data in the format our components expect
  return useMemo(() => {
    if (!completions || completions.length === 0) {
      console.log("No training completions available for dashboard");
      return [];
    }
    
    console.log(`Formatting ${completions.length} completions for dashboard use`);
    
    // Verify we're getting the large number of completions we expect
    if (completions.length > 1000) {
      console.log(`Processing large dataset: ${completions.length} completions`);
    } else if (completions.length < 11000) {
      console.warn(`Expected >11,000 completions but only received ${completions.length}. Data may be incomplete.`);
    }
    
    // Add a log to see a sample of the raw data
    if (completions.length > 0) {
      console.log("Sample raw completion data:", completions.slice(0, 3));
    }
    
    // Properly cast the data to our DB type for proper property access
    return completions.map((completion: any): TrainingCompletion => {
      const dbCompletion = completion as DbTrainingCompletion;
      
      // Use the completion date from either field, defaulting to the most likely field first
      const completionDate = dbCompletion.completed || dbCompletion.completion_date || '';
      
      return {
        id: `${dbCompletion.employee_id}-${dbCompletion.training_id}-${completionDate}`,
        employeeId: String(dbCompletion.employee_id),
        trainingId: String(dbCompletion.training_id),
        completionDate,
        status: 'completed' as const,
        instructor: dbCompletion.instructor,
        notes: dbCompletion.notes
      };
    });
  }, [completions]);
}

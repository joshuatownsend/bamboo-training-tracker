
import { useMemo } from "react";
import { Employee, Training, TrainingCompletion } from "@/lib/types";

// Define type for database training completion record with joined data
interface DbTrainingCompletion {
  employee_id: number | string;
  training_id: number | string;
  completed?: string;
  completion_date?: string;
  instructor?: string;
  notes?: string;
  employee?: {
    id: string;
    name: string;
    bamboo_employee_id: string;
    email?: string;
  } | null;
  training?: {
    id: string;
    name: string;
    category?: string;
  } | null;
  [key: string]: any; // For other potential fields
}

/**
 * Hook to format completion data for dashboard with enhanced support for joined data
 */
export function useCompletionFormatting(completions: any[] | undefined) {
  // Prepare the completions data in the format our components expect
  return useMemo(() => {
    if (!completions || completions.length === 0) {
      console.log("No training completions available for dashboard");
      return [];
    }
    
    console.log(`Formatting ${completions.length} completions for dashboard use`);
    
    // Add a log to see a sample of the raw data
    if (completions.length > 0) {
      console.log("Sample raw completion data:", completions.slice(0, 1));
    }
    
    // Properly cast the data to our DB type for proper property access
    return completions.map((completion: any): TrainingCompletion => {
      const dbCompletion = completion as DbTrainingCompletion;
      
      // Use the completion date from either field, defaulting to the most likely field first
      const completionDate = dbCompletion.completed || dbCompletion.completion_date || '';
      
      // Make sure employee and training data are properly handled
      const safeEmployeeData = dbCompletion.employee || {
        id: "unknown",
        name: "Unknown Employee",
        bamboo_employee_id: String(dbCompletion.employee_id)
      };
      
      const safeTrainingData = dbCompletion.training || {
        id: "unknown",
        name: "Unknown Training",
        category: "Unknown"
      };
      
      return {
        id: `${dbCompletion.employee_id}-${dbCompletion.training_id}-${completionDate}`,
        employeeId: String(dbCompletion.employee_id),
        trainingId: String(dbCompletion.training_id),
        completionDate,
        status: 'completed' as const,
        instructor: dbCompletion.instructor,
        notes: dbCompletion.notes,
        // Pass through the joined data if available with safety checks
        employeeData: safeEmployeeData,
        trainingData: safeTrainingData
      };
    });
  }, [completions]);
}

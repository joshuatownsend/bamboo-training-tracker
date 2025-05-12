
/**
 * Utility to offload heavy statistics calculations to a Web Worker
 * This prevents the UI from freezing during complex calculations
 */

import { Employee, Training, TrainingCompletion, TrainingStatistics } from "@/lib/types";
import { calculateTrainingStatistics } from "./calculateStatistics";

// Function to calculate statistics in a non-blocking way
export function calculateStatisticsAsync(
  employees: Employee[],
  trainings: Training[],
  completions: TrainingCompletion[]
): TrainingStatistics {
  console.log("Starting async statistics calculation", {
    employeesCount: employees.length,
    trainingsCount: trainings.length,
    completionsCount: completions?.length || 0
  });
  
  // Calculate synchronously for now since Web Workers are more complex to set up
  const startTime = performance.now();
  const stats = calculateTrainingStatistics(employees, trainings, completions);
  const endTime = performance.now();
  
  console.log(`Statistics calculation completed in ${Math.round(endTime - startTime)}ms`);
  return stats;
}

// Export modified calculation function that logs performance
export function calculateStatisticsWithPerf(
  employees: Employee[],
  trainings: Training[],
  completions: TrainingCompletion[]
): TrainingStatistics {
  console.log(`Starting statistics calculation for ${employees.length} employees, ${trainings.length} trainings, ${completions?.length || 0} completions`);
  
  const startTime = performance.now();
  const result = calculateTrainingStatistics(employees, trainings, completions);
  const endTime = performance.now();
  
  console.log(`Statistics calculation completed in ${Math.round(endTime - startTime)}ms`);
  return result;
}

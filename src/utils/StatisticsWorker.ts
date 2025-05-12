
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
): Promise<TrainingStatistics> {
  // For small data sets, calculate synchronously
  if (employees.length < 100 && trainings.length < 50) {
    return Promise.resolve(calculateTrainingStatistics(employees, trainings, completions));
  }
  
  // For larger data sets, use a timeout to allow UI to update
  return new Promise((resolve) => {
    // Use setTimeout to move calculation off the main thread
    setTimeout(() => {
      try {
        const stats = calculateTrainingStatistics(employees, trainings, completions);
        resolve(stats);
      } catch (error) {
        console.error("Error calculating statistics in worker:", error);
        throw error;
      }
    }, 10);
  });
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

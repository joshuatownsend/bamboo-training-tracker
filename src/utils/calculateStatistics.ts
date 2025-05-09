
import { DepartmentStats, Employee, Training, TrainingCompletion, TrainingStatistics } from "@/lib/types";

/**
 * Calculate training statistics from employee, training, and completion data
 */
export const calculateTrainingStatistics = (
  employees: Employee[], 
  trainings: Training[], 
  completions: TrainingCompletion[]
): TrainingStatistics => {
  // Calculate basic statistics
  const totalTrainings = trainings.length;
  
  // Check if completions is an array and not empty before filtering
  const completedTrainings = Array.isArray(completions) 
    ? completions.filter(c => c.status === "completed").length 
    : 0;
    
  const expiredTrainings = Array.isArray(completions)
    ? completions.filter(c => c.status === "expired").length
    : 0;
    
  const upcomingTrainings = Array.isArray(completions)
    ? completions.filter(c => c.status === "due").length
    : 0;

  // Calculate completion rate
  const completionRate = totalTrainings > 0 
    ? (completedTrainings / totalTrainings) * 100 
    : 0;

  console.log(`Calculated statistics - Total: ${totalTrainings}, Completed: ${completedTrainings}, Rate: ${completionRate}%`);
  
  // Calculate division statistics instead of department statistics
  const departmentStats = calculateDivisionStats(employees, trainings, completions);
  
  return {
    totalTrainings,
    completedTrainings,
    expiredTrainings,
    upcomingTrainings,
    completionRate,
    departmentStats
  };
};

/**
 * Helper function to calculate statistics per division
 */
export const calculateDivisionStats = (
  employees: Employee[], 
  trainings: Training[], 
  completions: TrainingCompletion[]
): DepartmentStats[] => {
  // Get unique divisions
  const divisions = [...new Set(employees.map(e => e.division))].filter(Boolean);
  
  return divisions.map(division => {
    // Get employees in division
    const divisionEmployees = employees.filter(e => e.division === division);
    
    // Get trainings that might be required for this division
    // Note: We're still using department in requiredFor as that's how the data is structured
    // In a future update, you might want to update the Training model to include division requirements
    const requiredTrainings = trainings.filter(t => 
      t.requiredFor?.includes(division) || t.requiredFor?.includes('Required')
    );
    
    // Count total required trainings
    const totalRequired = divisionEmployees.length * requiredTrainings.length;
    
    // Make sure completions is an array before filtering
    const completionsArray = Array.isArray(completions) ? completions : [];
    
    // Count completed trainings
    const completedCount = completionsArray.filter(c => 
      c.status === "completed" && 
      divisionEmployees.some(e => e.id === c.employeeId) &&
      requiredTrainings.some(t => t.id === c.trainingId)
    ).length;
    
    // Calculate compliance rate
    const complianceRate = totalRequired > 0 
      ? Math.round((completedCount / totalRequired) * 100) 
      : 100;
    
    return {
      department: division, // We'll still use the department field in the model
      completedCount,
      totalRequired,
      complianceRate
    };
  });
};

// Keeping the old function name for backward compatibility
export const calculateDepartmentStats = calculateDivisionStats;

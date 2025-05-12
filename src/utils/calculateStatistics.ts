
import { DepartmentStats, Employee, Training, TrainingCompletion, TrainingStatistics } from "@/lib/types";

/**
 * Calculate training statistics from employee, training, and completion data
 */
export const calculateTrainingStatistics = (
  employees: Employee[], 
  trainings: Training[], 
  completions: TrainingCompletion[]
): TrainingStatistics => {
  // Log what we're receiving to debug
  console.log("Calculating statistics with:", {
    employees: employees.length,
    trainings: trainings.length,
    completions: completions?.length || 0
  });
  
  // Ensure we have valid arrays to work with
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeTrainings = Array.isArray(trainings) ? trainings : [];
  const safeCompletions = Array.isArray(completions) ? completions : [];
  
  console.log("First few completions:", safeCompletions.slice(0, 3));
  
  // Calculate basic statistics
  const totalTrainings = safeTrainings.length || 0;
  const completedTrainings = safeCompletions.length || 0;
  const expiredTrainings = safeCompletions.filter(c => c.status === "expired").length || 0;
  const upcomingTrainings = safeCompletions.filter(c => c.status === "due").length || 0;

  // Calculate completion rate based on total possible completions (employees × trainings)
  const totalPossibleCompletions = safeEmployees.length * safeTrainings.length || 1; // Avoid division by zero
  const completionRate = (completedTrainings / totalPossibleCompletions) * 100;

  console.log(`Calculated statistics - Trainings: ${totalTrainings}, Completed: ${completedTrainings}, Rate: ${completionRate.toFixed(2)}%`);
  
  // Calculate division statistics 
  const departmentStats = calculateDivisionStats(safeEmployees, safeTrainings, safeCompletions);
  
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
  const divisions = [...new Set(employees.map(e => e.division || e.department || 'Unknown'))].filter(Boolean);
  
  if (divisions.length === 0) {
    console.log("No divisions found in employee data, adding default division");
    divisions.push('General');
  }
  
  return divisions.map(division => {
    // Get employees in division
    const divisionEmployees = employees.filter(e => 
      (e.division === division) || 
      (e.department === division) || 
      (!e.division && !e.department && division === 'General')
    );
    
    // Get trainings that might be required for this division
    const requiredTrainings = trainings.filter(t => 
      t.requiredFor?.includes(division) || 
      t.requiredFor?.includes('Required') || 
      !t.requiredFor || 
      t.requiredFor.length === 0
    );
    
    // Count total required trainings
    const totalRequired = divisionEmployees.length * requiredTrainings.length || 1; // Avoid division by zero
    
    // Count completed trainings
    const completedCount = completions.filter(c => 
      divisionEmployees.some(e => e.id === c.employeeId) &&
      requiredTrainings.some(t => t.id === c.trainingId)
    ).length;
    
    // Calculate compliance rate
    const complianceRate = Math.round((completedCount / totalRequired) * 100);
    
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


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
  const completedTrainings = completions.filter(c => c.status === "completed").length;
  const expiredTrainings = completions.filter(c => c.status === "expired").length;
  const upcomingTrainings = completions.filter(c => c.status === "due").length;
  
  // Calculate completion rate
  const completionRate = totalTrainings > 0 
    ? (completedTrainings / totalTrainings) * 100 
    : 0;
  
  // Calculate department statistics
  const departmentStats = calculateDepartmentStats(employees, trainings, completions);
  
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
 * Helper function to calculate statistics per department
 */
export const calculateDepartmentStats = (
  employees: Employee[], 
  trainings: Training[], 
  completions: TrainingCompletion[]
): DepartmentStats[] => {
  // Get unique departments
  const departments = [...new Set(employees.map(e => e.department))].filter(Boolean);
  
  return departments.map(department => {
    // Get employees in department
    const deptEmployees = employees.filter(e => e.department === department);
    
    // Get trainings that might be required for this department
    const requiredTrainings = trainings.filter(t => 
      t.requiredFor?.includes(department) || t.requiredFor?.includes('Required')
    );
    
    // Count total required trainings
    const totalRequired = deptEmployees.length * requiredTrainings.length;
    
    // Count completed trainings
    const completedCount = completions.filter(c => 
      c.status === "completed" && 
      deptEmployees.some(e => e.id === c.employeeId) &&
      requiredTrainings.some(t => t.id === c.trainingId)
    ).length;
    
    // Calculate compliance rate
    const complianceRate = totalRequired > 0 
      ? Math.round((completedCount / totalRequired) * 100) 
      : 100;
    
    return {
      department,
      completedCount,
      totalRequired,
      complianceRate
    };
  });
};

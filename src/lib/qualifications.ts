
import { Training, TrainingCompletion, Position, QualificationStatus } from "./types";

/**
 * Determines if an employee is qualified for a position
 */
export function checkPositionQualification(
  employeeId: string,
  positionId: string,
  positions: Position[],
  trainings: Training[],
  completions: TrainingCompletion[]
): QualificationStatus | null {
  const position = positions.find(p => p.id === positionId);
  if (!position) return null;

  // Get all of the employee's completed trainings (not expired)
  const employeeCompletedTrainings = completions
    .filter(c => c.employeeId === employeeId && c.status === "completed")
    .map(c => c.trainingId);

  // Check if employee meets county requirements
  const meetsCountyRequirements = position.countyRequirements.every(
    trainingId => employeeCompletedTrainings.includes(trainingId)
  );

  // Check if employee meets AVFRD requirements
  const meetsAVFRDRequirements = position.avfrdRequirements.every(
    trainingId => employeeCompletedTrainings.includes(trainingId)
  );

  // Get detailed training data
  const completedTrainingObjects = trainings.filter(
    t => employeeCompletedTrainings.includes(t.id)
  );
  
  const missingCountyTrainingIds = position.countyRequirements.filter(
    id => !employeeCompletedTrainings.includes(id)
  );
  
  const missingAVFRDTrainingIds = position.avfrdRequirements.filter(
    id => !employeeCompletedTrainings.includes(id)
  );
  
  const missingCountyTrainings = trainings.filter(
    t => missingCountyTrainingIds.includes(t.id)
  );
  
  const missingAVFRDTrainings = trainings.filter(
    t => missingAVFRDTrainingIds.includes(t.id)
  );

  return {
    positionId,
    positionTitle: position.title,
    isQualifiedCounty: meetsCountyRequirements,
    isQualifiedAVFRD: meetsAVFRDRequirements,
    missingCountyTrainings,
    missingAVFRDTrainings,
    completedTrainings: completedTrainingObjects
  };
}

/**
 * Get qualification status for all positions for an employee
 */
export function getAllPositionQualifications(
  employeeId: string,
  positions: Position[],
  trainings: Training[],
  completions: TrainingCompletion[]
): QualificationStatus[] {
  return positions
    .map(position => 
      checkPositionQualification(employeeId, position.id, positions, trainings, completions)
    )
    .filter((status): status is QualificationStatus => status !== null);
}

/**
 * Get all employees qualified for a specific position
 */
export function getEmployeesQualifiedForPosition(
  positionId: string,
  employees: any[],
  positions: Position[],
  trainings: Training[],
  completions: TrainingCompletion[],
  requirementType: 'county' | 'avfrd' = 'avfrd'
): any[] {
  return employees.filter(employee => {
    const qualification = checkPositionQualification(
      employee.id, 
      positionId, 
      positions, 
      trainings, 
      completions
    );
    
    if (!qualification) return false;
    
    return requirementType === 'county' 
      ? qualification.isQualifiedCounty
      : qualification.isQualifiedAVFRD;
  });
}

/**
 * Get training gaps for an employee to qualify for a position
 */
export function getTrainingGapsForPosition(
  employeeId: string,
  positionId: string,
  positions: Position[],
  trainings: Training[],
  completions: TrainingCompletion[]
): Training[] {
  const qualification = checkPositionQualification(
    employeeId,
    positionId,
    positions,
    trainings,
    completions
  );
  
  if (!qualification) return [];
  
  return qualification.missingAVFRDTrainings;
}

/**
 * Simulate adding a training to see impact on position qualifications
 */
export function simulateTrainingImpact(
  trainingId: string,
  employees: any[],
  positions: Position[],
  trainings: Training[],
  completions: TrainingCompletion[]
): Record<string, number> {
  // Create result object to store counts of newly qualified people by position
  const result: Record<string, number> = {};
  
  // Loop through each position
  positions.forEach(position => {
    // Skip if this training isn't required for this position
    if (!position.avfrdRequirements.includes(trainingId)) {
      result[position.id] = 0;
      return;
    }
    
    // Count how many employees would become qualified if they completed this training
    let newlyQualifiedCount = 0;
    
    employees.forEach(employee => {
      // Check current qualification status
      const currentStatus = checkPositionQualification(
        employee.id,
        position.id,
        positions,
        trainings,
        completions
      );
      
      if (!currentStatus || currentStatus.isQualifiedAVFRD) {
        // Already qualified or position not found
        return;
      }
      
      // If this is the only training they're missing, they'd become qualified
      if (currentStatus.missingAVFRDTrainings.length === 1 && 
          currentStatus.missingAVFRDTrainings[0].id === trainingId) {
        newlyQualifiedCount++;
      }
    });
    
    result[position.id] = newlyQualifiedCount;
  });
  
  return result;
}

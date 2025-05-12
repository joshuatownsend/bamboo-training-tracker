import { Training, TrainingCompletion, Position, QualificationStatus, RequirementGroup } from "./types";

/**
 * Evaluates a requirement group against a list of completed trainings
 */
export function evaluateRequirementGroup(
  group: RequirementGroup,
  completedTrainingIds: string[],
  trainingsMap: Record<string, Training>
): {
  isMet: boolean;
  missingTrainings: Training[];
} {
  // For AND logic - all requirements must be met
  if (group.logic === 'AND') {
    const results = group.requirements.map(req => {
      if (typeof req === 'string') {
        // It's a simple training ID
        const isMet = completedTrainingIds.includes(req);
        const missingTrainings = isMet ? [] : [trainingsMap[req]].filter(Boolean);
        return { isMet, missingTrainings };
      } else {
        // It's a nested requirement group
        return evaluateRequirementGroup(req, completedTrainingIds, trainingsMap);
      }
    });
    
    const isMet = results.every(result => result.isMet);
    const missingTrainings = results.flatMap(result => result.missingTrainings);
    return { isMet, missingTrainings };
  }
  
  // For OR logic - any requirement can be met
  if (group.logic === 'OR') {
    const results = group.requirements.map(req => {
      if (typeof req === 'string') {
        // It's a simple training ID
        const isMet = completedTrainingIds.includes(req);
        const missingTrainings = isMet ? [] : [trainingsMap[req]].filter(Boolean);
        return { isMet, missingTrainings };
      } else {
        // It's a nested requirement group
        return evaluateRequirementGroup(req, completedTrainingIds, trainingsMap);
      }
    });
    
    const isMet = results.some(result => result.isMet);
    
    // For OR logic, if one option is met, no missing trainings
    // Otherwise, collect missing trainings from all paths
    const missingTrainings = isMet ? [] : results.flatMap(result => result.missingTrainings);
    return { isMet, missingTrainings };
  }
  
  // For X_OF_Y logic - at least X requirements must be met
  if (group.logic === 'X_OF_Y') {
    const results = group.requirements.map(req => {
      if (typeof req === 'string') {
        // It's a simple training ID
        const isMet = completedTrainingIds.includes(req);
        const missingTrainings = isMet ? [] : [trainingsMap[req]].filter(Boolean);
        return { isMet, missingTrainings };
      } else {
        // It's a nested requirement group
        return evaluateRequirementGroup(req, completedTrainingIds, trainingsMap);
      }
    });
    
    const metCount = results.filter(result => result.isMet).length;
    const requiredCount = group.count || 2; // Default to 2 if not specified
    const isMet = metCount >= requiredCount;
    
    // For X_OF_Y logic, if enough are met, no missing trainings
    // Otherwise, collect missing trainings but prioritize those closest to completion
    let missingTrainings: Training[] = [];
    if (!isMet) {
      // Sort results by "most met" (fewest missing trainings)
      const sortedResults = [...results]
        .filter(result => !result.isMet) // Only consider unmet requirements
        .sort((a, b) => a.missingTrainings.length - b.missingTrainings.length);
      
      // Calculate how many more requirements need to be met
      const needToMeet = requiredCount - metCount;
      
      // Get missing trainings from the easiest-to-complete requirements
      missingTrainings = sortedResults
        .slice(0, needToMeet)
        .flatMap(result => result.missingTrainings);
    }
    
    return { isMet, missingTrainings };
  }
  
  // Default fallback (should never happen)
  return { isMet: false, missingTrainings: [] };
}

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

  // Map of training IDs to training objects for quick lookup
  const trainingsMap = trainings.reduce((acc, training) => {
    acc[training.id] = training;
    return acc;
  }, {} as Record<string, Training>);

  // Get all of the employee's completed trainings (not expired)
  const employeeCompletions = completions
    .filter(c => c.employeeId === employeeId && c.status === "completed");
  
  const employeeCompletedTrainingIds = employeeCompletions
    .map(c => c.trainingId);

  // Check if requirements are the legacy array format or the new complex format
  const countyRequirements = position.countyRequirements;
  const avfrdRequirements = position.avfrdRequirements;
  
  // Evaluate county requirements
  let meetsCountyRequirements = false;
  let missingCountyTrainings: Training[] = [];
  
  if (Array.isArray(countyRequirements)) {
    // Legacy array format - simple "all required" check
    meetsCountyRequirements = countyRequirements.every(
      trainingId => employeeCompletedTrainingIds.includes(trainingId)
    );
    
    missingCountyTrainings = countyRequirements
      .filter(id => !employeeCompletedTrainingIds.includes(id))
      .map(id => trainingsMap[id])
      .filter(Boolean); // Filter out undefined values
  } else {
    // New complex requirements format
    const countyResult = evaluateRequirementGroup(
      countyRequirements,
      employeeCompletedTrainingIds,
      trainingsMap
    );
    
    meetsCountyRequirements = countyResult.isMet;
    missingCountyTrainings = countyResult.missingTrainings;
  }
  
  // Evaluate AVFRD requirements
  let meetsAVFRDRequirements = false;
  let missingAVFRDTrainings: Training[] = [];
  
  if (Array.isArray(avfrdRequirements)) {
    // Legacy array format - simple "all required" check
    meetsAVFRDRequirements = avfrdRequirements.every(
      trainingId => employeeCompletedTrainingIds.includes(trainingId)
    );
    
    missingAVFRDTrainings = avfrdRequirements
      .filter(id => !employeeCompletedTrainingIds.includes(id))
      .map(id => trainingsMap[id])
      .filter(Boolean); // Filter out undefined values
  } else {
    // New complex requirements format
    const avfrdResult = evaluateRequirementGroup(
      avfrdRequirements,
      employeeCompletedTrainingIds,
      trainingsMap
    );
    
    meetsAVFRDRequirements = avfrdResult.isMet;
    missingAVFRDTrainings = avfrdResult.missingTrainings;
  }

  // Get completed training objects
  const completedTrainingObjects = trainings.filter(
    t => employeeCompletedTrainingIds.includes(t.id)
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
  requirementType: 'county' | 'avfrd' | 'both' = 'avfrd'
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
    
    if (requirementType === 'both') {
      return qualification.isQualifiedCounty && qualification.isQualifiedAVFRD;
    }
    
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
    // Check if position uses complex requirements
    let isRelevantForPosition = false;
    
    if (Array.isArray(position.avfrdRequirements)) {
      // Simple requirement list
      isRelevantForPosition = position.avfrdRequirements.includes(trainingId);
    } else {
      // Complex requirement structure - check if training appears anywhere in the structure
      const findTrainingInGroup = (group: RequirementGroup): boolean => {
        return group.requirements.some(req => {
          if (typeof req === 'string') {
            return req === trainingId;
          } else {
            return findTrainingInGroup(req);
          }
        });
      };
      
      isRelevantForPosition = findTrainingInGroup(position.avfrdRequirements);
    }
    
    // Skip if this training isn't required for this position at all
    if (!isRelevantForPosition) {
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
      
      // Create hypothetical completion for the training
      const simulatedCompletions = [
        ...completions,
        {
          id: `simulated-${Date.now()}`,
          employeeId: employee.id,
          trainingId: trainingId,
          completionDate: new Date().toISOString(),
          status: 'completed' as const
        }
      ];
      
      // Check if they would become qualified with the new training
      const simulatedStatus = checkPositionQualification(
        employee.id,
        position.id,
        positions,
        trainings,
        simulatedCompletions
      );
      
      if (simulatedStatus?.isQualifiedAVFRD) {
        newlyQualifiedCount++;
      }
    });
    
    result[position.id] = newlyQualifiedCount;
  });
  
  return result;
}

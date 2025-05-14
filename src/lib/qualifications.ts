import { Training, TrainingCompletion, Position, QualificationStatus, RequirementGroup } from "./types";
import { toStringId } from "@/utils/idConverters";

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
  // Ensure all training IDs are strings for consistent comparison
  const normalizedCompletedIds = completedTrainingIds.map(id => toStringId(id));

  // For AND logic - all requirements must be met
  if (group.logic === 'AND') {
    const results = group.requirements.map(req => {
      if (typeof req === 'string') {
        // It's a simple training ID
        const stringReq = toStringId(req);
        const isMet = normalizedCompletedIds.includes(stringReq);
        const missingTrainings = isMet ? [] : [trainingsMap[stringReq]].filter(Boolean);
        return { isMet, missingTrainings };
      } else {
        // It's a nested requirement group
        return evaluateRequirementGroup(req, normalizedCompletedIds, trainingsMap);
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
        const stringReq = toStringId(req);
        const isMet = normalizedCompletedIds.includes(stringReq);
        const missingTrainings = isMet ? [] : [trainingsMap[stringReq]].filter(Boolean);
        return { isMet, missingTrainings };
      } else {
        // It's a nested requirement group
        return evaluateRequirementGroup(req, normalizedCompletedIds, trainingsMap);
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
        const stringReq = toStringId(req);
        const isMet = normalizedCompletedIds.includes(stringReq);
        const missingTrainings = isMet ? [] : [trainingsMap[stringReq]].filter(Boolean);
        return { isMet, missingTrainings };
      } else {
        // It's a nested requirement group
        return evaluateRequirementGroup(req, normalizedCompletedIds, trainingsMap);
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
  console.log(`Checking qualifications for employee ${employeeId} and position ${positionId}`);
  
  // Ensure IDs are strings for consistent comparison
  const stringEmployeeId = toStringId(employeeId);
  const stringPositionId = toStringId(positionId);
  
  const position = positions.find(p => toStringId(p.id) === stringPositionId);
  if (!position) {
    console.log(`Position ${positionId} not found`);
    return null;
  }

  // Map of training IDs to training objects for quick lookup
  const trainingsMap = trainings.reduce((acc, training) => {
    const stringId = toStringId(training.id);
    acc[stringId] = training;
    return acc;
  }, {} as Record<string, Training>);

  // Get all of the employee's completed trainings (not expired)
  const employeeCompletions = completions
    .filter(c => toStringId(c.employeeId) === stringEmployeeId && c.status === "completed");
  
  const employeeCompletedTrainingIds = employeeCompletions
    .map(c => toStringId(c.trainingId));

  // Add debug logging
  console.log(`Employee ${employeeId} has ${employeeCompletedTrainingIds.length} completed trainings`);
  console.log("First few training IDs:", employeeCompletedTrainingIds.slice(0, 5));

  // Check if requirements are the legacy array format or the new complex format
  const countyRequirements = position.countyRequirements;
  const avfrdRequirements = position.avfrdRequirements;
  
  // Evaluate county requirements
  let meetsCountyRequirements = false;
  let missingCountyTrainings: Training[] = [];
  
  if (Array.isArray(countyRequirements)) {
    // Legacy array format - simple "all required" check
    const normalizedRequirements = countyRequirements.map(id => toStringId(id));
    meetsCountyRequirements = normalizedRequirements.every(
      reqId => employeeCompletedTrainingIds.some(id => toStringId(id) === reqId)
    );
    
    missingCountyTrainings = normalizedRequirements
      .filter(id => !employeeCompletedTrainingIds.some(completedId => toStringId(completedId) === id))
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
    const normalizedRequirements = avfrdRequirements.map(id => toStringId(id));
    meetsAVFRDRequirements = normalizedRequirements.every(
      reqId => employeeCompletedTrainingIds.some(id => toStringId(id) === reqId)
    );
    
    missingAVFRDTrainings = normalizedRequirements
      .filter(id => !employeeCompletedTrainingIds.some(completedId => toStringId(completedId) === id))
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

  // Log the qualification result
  console.log(`Qualification results for ${position.title}:`, {
    countyQualified: meetsCountyRequirements,
    avfrdQualified: meetsAVFRDRequirements,
    missingCountyCount: missingCountyTrainings.length,
    missingAVFRDCount: missingAVFRDTrainings.length
  });

  // Get completed training objects
  const completedTrainingObjects = trainings.filter(
    t => employeeCompletedTrainingIds.includes(toStringId(t.id))
  );

  return {
    positionId: stringPositionId,
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
  const stringEmployeeId = toStringId(employeeId);
  
  return positions
    .map(position => 
      checkPositionQualification(stringEmployeeId, position.id, positions, trainings, completions)
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
  const stringPositionId = toStringId(positionId);
  console.log(`Finding employees qualified for position ${positionId} (${stringPositionId}), type: ${requirementType}`);
  console.log(`Total employees: ${employees.length}, Total completions: ${completions.length}`);

  // Find the position to get its title for debugging
  const position = positions.find(p => toStringId(p.id) === stringPositionId);
  const positionTitle = position ? position.title : "Unknown Position";
  
  const qualifiedEmployees = employees.filter(employee => {
    // Ensure employee ID is a string
    const employeeStringId = toStringId(employee.id);
    
    const qualification = checkPositionQualification(
      employeeStringId, 
      stringPositionId, 
      positions, 
      trainings, 
      completions
    );
    
    if (!qualification) return false;
    
    const isQualified = 
      requirementType === 'both' ? 
        (qualification.isQualifiedCounty && qualification.isQualifiedAVFRD) :
      requirementType === 'county' ? 
        qualification.isQualifiedCounty :
        qualification.isQualifiedAVFRD;
    
    return isQualified;
  });
  
  console.log(`Found ${qualifiedEmployees.length} employees qualified for "${positionTitle}" (${requirementType} requirements)`);
  
  // If no qualifications found, log more details to help troubleshoot
  if (qualifiedEmployees.length === 0 && employees.length > 0) {
    const sampleEmployee = employees[0];
    console.log(`Sample check for ${sampleEmployee.firstName} ${sampleEmployee.lastName} (ID: ${sampleEmployee.id}):`);
    
    const sampleQualification = checkPositionQualification(
      sampleEmployee.id,
      stringPositionId,
      positions,
      trainings,
      completions
    );
    
    if (sampleQualification) {
      console.log('Sample qualification result:', {
        countyQualified: sampleQualification.isQualifiedCounty,
        avfrdQualified: sampleQualification.isQualifiedAVFRD,
        missingCounty: sampleQualification.missingCountyTrainings.map(t => t.title),
        missingAVFRD: sampleQualification.missingAVFRDTrainings.map(t => t.title)
      });
    } else {
      console.log('No qualification result for sample employee');
    }
  }
  
  return qualifiedEmployees;
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

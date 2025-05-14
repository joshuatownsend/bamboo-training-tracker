
import { TrainingCompletion, UserTraining, Training } from './types';
import { CompletionJoinedRow } from './dbTypes';
import { toStringId } from '@/utils/idConverters';

/**
 * Maps a database row to a TrainingCompletion object
 * Handles null safety for joined data
 */
export function mapToTrainingCompletion(record: CompletionJoinedRow): TrainingCompletion {
  // Extract employee data with null safety
  const employeeData = record.employee ? {
    id: String(record.employee.id),
    name: record.employee.name || record.display_name || "Unknown Employee",
    bamboo_employee_id: String(record.employee.bamboo_employee_id),
    email: record.employee.email
  } : {
    id: "unknown",
    name: record.display_name || "Unknown Employee",
    bamboo_employee_id: String(record.employee_id),
    email: undefined
  };

  // Extract training data with null safety
  const trainingData = record.training ? {
    id: String(record.training.id),
    name: record.training.name,
    category: record.training.category || "Unknown"
  } : {
    id: String(record.training_id),
    name: "Training " + record.training_id,
    category: "Unknown"
  };

  return {
    id: `${record.employee_id}-${record.training_id}-${record.completed}`,
    employeeId: String(record.employee_id),
    trainingId: String(record.training_id),
    completionDate: record.completed,
    status: 'completed' as const,
    instructor: record.instructor ?? undefined,
    notes: record.notes ?? undefined,
    employeeData,
    trainingData
  };
}

/**
 * Maps a database row to a UserTraining object
 * Handles null safety for joined data
 */
export function mapToUserTraining(record: CompletionJoinedRow): UserTraining {
  // Create training details with null safety
  const trainingDetails: Training = record.training ? {
    id: String(record.training.id),
    title: record.training.name,
    type: String(record.training_id),
    category: record.training.category || 'Uncategorized',
    description: record.training.description || '',
    durationHours: 0,
    requiredFor: []
  } : {
    id: String(record.training_id),
    title: `Training ${record.training_id}`,
    type: String(record.training_id),
    category: 'Uncategorized',
    description: '',
    durationHours: 0,
    requiredFor: []
  };

  return {
    id: `${record.employee_id}-${record.training_id}-${record.completed}`,
    employeeId: String(record.employee_id),
    trainingId: toStringId(record.training_id),
    completionDate: record.completed,
    instructor: record.instructor ?? undefined,
    notes: record.notes ?? undefined,
    type: toStringId(record.training_id),
    completed: record.completed,
    trainingDetails
  };
}

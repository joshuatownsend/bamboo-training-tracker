
import { CompletionJoinedRow } from "./dbTypes";
import { UserTraining, Training, TrainingCompletion } from "./types";
import { toStringId } from "../utils/idConverters";

/**
 * Maps database completion row to UserTraining object
 */
export function mapToUserTraining(row: CompletionJoinedRow): UserTraining {
  console.log("Mapping row to UserTraining:", row);
  
  // Handle cases where the training property is null or undefined
  const trainingDetails: Training = row.training ? {
    id: row.training.id?.toString() || `${row.training_id}`,
    title: row.training.name || `Training ${row.training_id}`,
    description: row.training.description || "",
    category: row.training.category || "Unknown",
    type: "training", // Adding required properties
    durationHours: 0, // Default value for required property
    requiredFor: [] // Default value for required property
  } : {
    id: `${row.training_id}`,
    title: `Training ${row.training_id}`,
    description: "",
    category: "Unknown",
    type: "training", // Adding required properties
    durationHours: 0, // Default value for required property
    requiredFor: [] // Default value for required property
  };
  
  return {
    trainingId: toStringId(row.training_id),
    employeeId: toStringId(row.employee_id),
    displayName: row.display_name || "",
    completionDate: row.completed ? row.completed : "",
    instructor: row.instructor || "",
    notes: row.notes || "",
    trainingDetails
  };
}

/**
 * Maps database completion row to TrainingCompletion object
 */
export function mapToTrainingCompletion(row: CompletionJoinedRow): TrainingCompletion {
  return {
    id: `${row.employee_id}-${row.training_id}-${row.completed}`,
    employeeId: toStringId(row.employee_id),
    trainingId: toStringId(row.training_id),
    completionDate: row.completed,
    status: 'completed',
    instructor: row.instructor || undefined,
    notes: row.notes || undefined,
    // Include employee data if available
    employeeData: row.employee ? {
      id: toStringId(row.employee.id),
      name: row.employee.name || row.display_name || "Unknown",
      bamboo_employee_id: toStringId(row.employee.bamboo_employee_id || row.employee_id)
    } : {
      id: "unknown",
      name: row.display_name || "Unknown",
      bamboo_employee_id: toStringId(row.employee_id)
    },
    // Include training data if available
    trainingData: row.training ? {
      id: toStringId(row.training.id),
      name: row.training.name,
      category: row.training.category || "Unknown"
    } : {
      id: toStringId(row.training_id),
      name: `Training ${row.training_id}`,
      category: "Unknown"
    }
  };
}

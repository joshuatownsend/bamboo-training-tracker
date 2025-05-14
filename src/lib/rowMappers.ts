
import { CompletionJoinedRow } from "./dbTypes";
import { UserTraining } from "./types";
import { toStringId } from "../utils/idConverters";

/**
 * Maps database completion row to UserTraining object
 */
export function mapToUserTraining(row: CompletionJoinedRow): UserTraining {
  console.log("Mapping row to UserTraining:", row);
  
  // Handle cases where the training property is null or undefined
  const trainingDetails = row.training ? {
    id: row.training.id?.toString() || `${row.training_id}`,
    title: row.training.name || `Training ${row.training_id}`,
    description: row.training.description || "",
    category: row.training.category || "Unknown"
  } : {
    id: `${row.training_id}`,
    title: `Training ${row.training_id}`,
    description: "",
    category: "Unknown"
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

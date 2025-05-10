
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserTraining } from "@/lib/types";
import { useTrainingTypeNames } from "@/hooks/useTrainingTypeNames";
import { safeTextValue, groupTrainingsByCategory } from "@/lib/training-utils";
import { TableCategoryHeader } from "./TableCategoryHeader";
import { TrainingTableRow } from "./TrainingTableRow";
import { EmptyTrainingsState } from "./EmptyTrainingsState";

interface UserTrainingsTableProps {
  trainings: UserTraining[];
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
}

export function UserTrainingsTable({ trainings, onSort }: UserTrainingsTableProps) {
  const { trainingTypeNames, isLoadingNames } = useTrainingTypeNames(trainings);

  // Group trainings by category for better organization
  const groupedTrainings = groupTrainingsByCategory(trainings);

  // Get categories and sort them
  const categories = Object.keys(groupedTrainings).sort();

  // Function to get proper training name - prioritize Supabase data
  const getTrainingName = (training: UserTraining): string => {
    // First check if we have the name from Supabase
    const trainingId = training.trainingId || training.type?.toString() || '';
    if (trainingId && trainingTypeNames[trainingId]) {
      return trainingTypeNames[trainingId];
    }
    
    // If not in Supabase, try the fallback options
    // First try to get the name from trainingDetails
    if (training.trainingDetails) {
      // Use title first as it's most likely to be user-friendly
      if (training.trainingDetails.title) {
        return safeTextValue(training.trainingDetails.title);
      }
      
      // Fallback to type if it looks like a name (not just an ID)
      if (training.trainingDetails.type && 
          !training.trainingDetails.type.match(/^\d+$/)) {
        return safeTextValue(training.trainingDetails.type);
      }
    }
    
    // Try other properties that might contain the name
    if (training.type) {
      return safeTextValue(training.type);
    }
    
    // Last resort - use training ID with a prefix
    return `Training ${safeTextValue(training.trainingId || training.id)}`;
  };

  return (
    <div className="rounded-md border bg-white">
      {isLoadingNames && (
        <div className="bg-yellow-50 text-yellow-800 p-2 text-xs text-center">
          Loading training names from database...
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-1/3">Training Course</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Completion Date</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainings.length === 0 ? (
            <EmptyTrainingsState />
          ) : (
            categories.map((category) => (
              <React.Fragment key={`category-${safeTextValue(category)}`}>
                <TableCategoryHeader category={safeTextValue(category)} />
                {groupedTrainings[category].map((training) => (
                  <TrainingTableRow 
                    key={safeTextValue(training.id)}
                    training={training}
                    getTrainingName={getTrainingName}
                    category={category}
                  />
                ))}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default UserTrainingsTable;

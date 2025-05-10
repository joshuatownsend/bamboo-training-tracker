
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrainingTableRow } from "./TrainingTableRow";
import { EmptyTrainingsState } from "./EmptyTrainingsState";
import { UserTraining } from "@/lib/types";
import { TableCategoryHeader } from "./TableCategoryHeader";
import { useTrainingTypeNames } from "@/hooks/useTrainingTypeNames";
import { LoadingState } from "./LoadingState";
import { useUser } from "@/contexts/UserContext";

interface UserTrainingsTableProps {
  trainings: UserTraining[];
}

export function UserTrainingsTable({ trainings }: UserTrainingsTableProps) {
  const { trainingTypeNames, isLoadingNames } = useTrainingTypeNames(trainings);
  const { isAdmin } = useUser();
  
  // Group trainings by category
  const trainingsByCategory: Record<string, UserTraining[]> = {};
  
  trainings.forEach(training => {
    // Use trainingDetails.category if available, otherwise use a default category
    const category = training.trainingDetails?.category || 'Uncategorized';
    if (!trainingsByCategory[category]) {
      trainingsByCategory[category] = [];
    }
    trainingsByCategory[category].push(training);
  });
  
  const categories = Object.keys(trainingsByCategory).sort();

  if (isLoadingNames) {
    return <LoadingState />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Training Name</TableHead>
          <TableHead>Completion Date</TableHead>
          <TableHead>Expiration Date</TableHead>
          <TableHead className="text-right">Certificate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trainings.length === 0 ? (
          <EmptyTrainingsState isAdmin={isAdmin} />
        ) : (
          categories.map(category => (
            <React.Fragment key={category}>
              <TableCategoryHeader category={category} />
              {trainingsByCategory[category].map(training => (
                <TrainingTableRow 
                  key={`${training.id}-${training.completionDate}`}
                  training={training}
                  trainingTypeNames={trainingTypeNames}
                  category={category}
                />
              ))}
            </React.Fragment>
          ))
        )}
      </TableBody>
    </Table>
  );
}

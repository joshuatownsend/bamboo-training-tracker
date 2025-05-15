
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrainingTableRow } from "./TrainingTableRow";
import { EmptyTrainingsState } from "./EmptyTrainingsState";
import { UserTraining } from "@/lib/types";
import { LoadingState } from "./LoadingState";
import { useTrainingTypeNames } from "@/hooks/useTrainingTypeNames";
import { useUser } from "@/contexts/user";

interface UserTrainingsTableProps {
  trainings: UserTraining[];
}

export function UserTrainingsTable({ trainings }: UserTrainingsTableProps) {
  const { trainingTypeNames, isLoadingNames } = useTrainingTypeNames(trainings);
  const { isAdmin } = useUser();
  
  if (isLoadingNames) {
    return <LoadingState />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Training Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Completion Date</TableHead>
          <TableHead>Expiration Date</TableHead>
          <TableHead className="text-right">Certificate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trainings.length === 0 ? (
          <EmptyTrainingsState isAdmin={isAdmin} />
        ) : (
          trainings.map(training => (
            <TrainingTableRow 
              key={`${training.id}-${training.completionDate}`}
              training={training}
              trainingTypeNames={trainingTypeNames}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}

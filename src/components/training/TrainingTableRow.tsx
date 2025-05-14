
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { UserTraining } from "@/lib/types";
import { safeTextValue, formatDate, openInBambooHR } from '@/lib/training-utils';

export interface TrainingTableRowProps {
  training: UserTraining;
  trainingTypeNames: Record<string, string>;
}

export function TrainingTableRow({ training, trainingTypeNames }: TrainingTableRowProps) {
  // Helper function to get training name from type ID
  const getTrainingName = (training: UserTraining): string => {
    if (training.trainingDetails?.title) {
      return safeTextValue(training.trainingDetails.title);
    }
    
    // Use the training type ID to look up the name in trainingTypeNames
    const typeId = training.trainingId || training.type?.toString() || '';
    return trainingTypeNames[typeId] || `Training ${typeId}`;
  };

  // Get the category from training details or display "Uncategorized"
  const getCategory = (training: UserTraining): string => {
    return safeTextValue(training.trainingDetails?.category) || "Uncategorized";
  };

  // FIXED: Log the completionDate for debugging
  console.log("TrainingTableRow - training completion date:", {
    completionDate: training.completionDate,
    id: training.id,
    type: typeof training.completionDate
  });

  return (
    <TableRow key={safeTextValue(training.id)}>
      <TableCell>
        <div>
          <div className="font-medium">
            {getTrainingName(training)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {safeTextValue(training.trainingDetails?.description) || "No description available"}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {getCategory(training)}
      </TableCell>
      <TableCell>
        {/* FIXED: Use formatDate but with better logging */}
        {(() => {
          const formattedDate = formatDate(safeTextValue(training.completionDate));
          console.log("TrainingTableRow - formatted completion date:", formattedDate);
          return formattedDate;
        })()}
      </TableCell>
      <TableCell>
        {training.trainingDetails && 
          ('expirationDate' in training.trainingDetails) ? 
          formatDate(safeTextValue(training.trainingDetails.expirationDate as string)) : 
          "No expiration"
        }
      </TableCell>
      <TableCell className="text-right">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => openInBambooHR(training.employeeId)}
          className="gap-1"
        >
          <ExternalLink className="h-4 w-4" /> 
          View Training Record
        </Button>
      </TableCell>
    </TableRow>
  );
}

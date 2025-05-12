
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
    if (training.training_details?.title) {
      return safeTextValue(training.training_details.title);
    }
    
    // Use the training type ID to look up the name in trainingTypeNames
    const typeId = training.training_id || training.type?.toString() || '';
    return trainingTypeNames[typeId] || `Training ${typeId}`;
  };

  // Get the category from training details or display "Uncategorized"
  const getCategory = (training: UserTraining): string => {
    return safeTextValue(training.training_details?.category) || "Uncategorized";
  };

  return (
    <TableRow key={safeTextValue(training.id)}>
      <TableCell>
        <div>
          <div className="font-medium">
            {getTrainingName(training)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {safeTextValue(training.training_details?.description) || "No description available"}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {getCategory(training)}
      </TableCell>
      <TableCell>
        {formatDate(safeTextValue(training.completion_date))}
      </TableCell>
      <TableCell>
        {training.training_details && 
          ('expiration_date' in training.training_details) ? 
          formatDate(safeTextValue(training.training_details.expiration_date as string)) : 
          "No expiration"
        }
      </TableCell>
      <TableCell className="text-right">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => openInBambooHR(training.employee_id)}
          className="gap-1"
        >
          <ExternalLink className="h-4 w-4" /> 
          View Training Record
        </Button>
      </TableCell>
    </TableRow>
  );
}

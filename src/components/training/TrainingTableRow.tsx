
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { UserTraining } from "@/lib/types";
import { safeTextValue, formatDate, openInBambooHR } from '@/lib/training-utils';

export interface TrainingTableRowProps {
  training: UserTraining;
  trainingTypeNames: Record<string, string>;
  category?: string;
}

export function TrainingTableRow({ training, trainingTypeNames, category }: TrainingTableRowProps) {
  // Helper function to get training name from type ID
  const getTrainingName = (training: UserTraining): string => {
    if (training.trainingDetails?.title) {
      return safeTextValue(training.trainingDetails.title);
    }
    
    // Use the training type ID to look up the name in trainingTypeNames
    const typeId = training.trainingId || training.type?.toString() || '';
    return trainingTypeNames[typeId] || `Training ${typeId}`;
  };

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
        {formatDate(safeTextValue(training.completionDate))}
      </TableCell>
      <TableCell>
        {/* Fix the property access - the property might not exist on the Training type */}
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

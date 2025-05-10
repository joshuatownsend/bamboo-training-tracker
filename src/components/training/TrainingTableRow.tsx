
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { UserTraining } from "@/lib/types";
import { safeTextValue, formatDate, openInBambooHR } from '@/lib/training-utils';

interface TrainingTableRowProps {
  training: UserTraining;
  getTrainingName: (training: UserTraining) => string;
  category: string;
}

export function TrainingTableRow({ training, getTrainingName, category }: TrainingTableRowProps) {
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
        <Badge variant="outline" className="bg-muted/30">
          {safeTextValue(training.trainingDetails?.category) || safeTextValue(category)}
        </Badge>
      </TableCell>
      <TableCell>
        {formatDate(safeTextValue(training.completionDate))}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {safeTextValue(training.notes) || "No notes"}
          {training.instructor && (
            <div className="text-xs text-muted-foreground mt-1">
              Instructor: {safeTextValue(training.instructor)}
            </div>
          )}
        </div>
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

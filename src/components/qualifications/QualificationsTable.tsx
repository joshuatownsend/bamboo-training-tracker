
import React from 'react';
import { 
  Table, TableHeader, TableBody, TableRow, 
  TableHead, TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { QualificationStatus, Training } from "@/lib/types";

interface QualificationsTableProps {
  qualifications: QualificationStatus[];
  type: 'county' | 'avfrd';
}

export function QualificationsTable({ qualifications, type }: QualificationsTableProps) {
  const isQualifiedKey = type === 'county' ? 'isQualifiedCounty' : 'isQualifiedAVFRD';
  const missingTrainingsKey = type === 'county' ? 'missingCountyTrainings' : 'missingAVFRDTrainings';
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Position</TableHead>
          <TableHead className="w-[100px]">Status</TableHead>
          <TableHead>Missing Requirements</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {qualifications.map((qualification) => (
          <TableRow key={qualification.positionId}>
            <TableCell className="font-medium">
              {qualification.positionTitle}
            </TableCell>
            <TableCell>
              {qualification[isQualifiedKey] ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  <span>Qualified</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="mr-1 h-4 w-4" />
                  <span>Not Qualified</span>
                </div>
              )}
            </TableCell>
            <TableCell>
              {qualification[missingTrainingsKey].length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {qualification[missingTrainingsKey].map((training: Training) => (
                    <Badge key={training.id} variant="outline">
                      {training.title}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">
                  None - All requirements met
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
        {qualifications.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-center py-4">
              No qualification data available
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

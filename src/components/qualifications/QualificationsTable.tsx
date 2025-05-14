
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
  
  // Ensure we have valid qualifications to work with
  const safeQualifications = qualifications || [];
  
  console.log(`Rendering QualificationsTable for ${type} with:`, {
    count: safeQualifications.length,
    qualifications: safeQualifications
  });
  
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
        {safeQualifications.map((qualification) => (
          <TableRow key={qualification.positionId}>
            <TableCell className="font-medium">
              {qualification.positionTitle || "Unknown Position"}
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
              {qualification[missingTrainingsKey]?.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {qualification[missingTrainingsKey].map((training: Training, index) => (
                    <Badge key={`${training.id || 'unknown'}-${index}`} variant="outline">
                      {training.title || `Training ${training.id}` || "Unknown Training"}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">
                  {qualification[isQualifiedKey] ? "None - All requirements met" : "No specific requirements defined"}
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
        {safeQualifications.length === 0 && (
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

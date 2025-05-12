
import React from 'react';
import { 
  Table, TableHeader, TableBody, TableRow, 
  TableHead, TableCell 
} from "@/components/ui/table";
import { QualificationStatus } from "@/lib/types";
import { CheckCircle } from "lucide-react";

interface QualificationsBothTableProps {
  qualifications: QualificationStatus[];
}

export function QualificationsBothTable({ qualifications }: QualificationsBothTableProps) {
  // Filter positions that qualify for both County and AVFRD requirements
  const qualifiedForBoth = qualifications.filter(
    qualification => qualification.isQualifiedCounty && qualification.isQualifiedAVFRD
  );
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Position</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {qualifiedForBoth.length > 0 ? (
          qualifiedForBoth.map((qualification) => (
            <TableRow key={qualification.positionId}>
              <TableCell className="font-medium">
                {qualification.positionTitle}
              </TableCell>
              <TableCell>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  <span>Qualified for Both</span>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={2} className="text-center py-4">
              Not qualified for any position under both County and AVFRD requirements
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

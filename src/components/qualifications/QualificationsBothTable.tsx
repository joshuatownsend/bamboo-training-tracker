
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
    qualification => qualification.is_qualified_county && qualification.is_qualified_avfrd
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
            <TableRow key={qualification.position_id}>
              <TableCell className="font-medium">
                {qualification.position_title}
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

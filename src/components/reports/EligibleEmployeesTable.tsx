
import React from "react";
import { 
  Table, TableHeader, TableBody, TableRow, 
  TableHead, TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Employee, QualificationStatus } from "@/lib/types";

interface EligibleEmployeesTableProps {
  filteredEmployees: Employee[];
  requirementType: "county" | "avfrd" | "both";
  getQualification: (employeeId: string) => QualificationStatus | null;
}

export function EligibleEmployeesTable({
  filteredEmployees,
  requirementType,
  getQualification
}: EligibleEmployeesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Current Position</TableHead>
          <TableHead className="w-[300px]">
            {requirementType === "county" ? "Missing AVFRD Requirements" : 
            requirementType === "avfrd" ? "Completed Requirements" : 
            "Requirements Status"}
          </TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(employee => {
            const qualification = getQualification(employee.id);
            
            if (!qualification) return null;
            
            return (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">
                  {employee.first_name} {employee.last_name}
                </TableCell>
                <TableCell>{employee.job_title}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {requirementType === "county" && 
                      qualification.missing_avfrd_trainings.map((training) => (
                        <Badge key={training.id} variant="outline">
                          {training.title}
                        </Badge>
                      ))
                    }
                    {requirementType === "avfrd" &&
                      qualification.completed_trainings.slice(0, 3).map((training) => (
                        <Badge key={training.id} variant="outline">
                          {training.title}
                        </Badge>
                      ))
                    }
                    {requirementType === "both" && (
                      <span>
                        County: {qualification.is_qualified_county ? '✓' : '✗'},
                        AVFRD: {qualification.is_qualified_avfrd ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {requirementType === "county" ? (
                      <div className="flex items-center text-amber-500">
                        <AlertCircle className="mr-1 h-4 w-4" />
                        <span>Eligible</span>
                      </div>
                    ) : requirementType === "avfrd" ? (
                      <div className="flex items-center text-emerald-500">
                        <span>Qualified</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-muted-foreground">
                        <span>Mixed Status</span>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
              No eligible volunteers found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

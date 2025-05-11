
import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CheckCircle } from "lucide-react";
import { Employee } from "@/lib/types";
import { QualificationsLoadingState } from "@/components/qualifications/LoadingState";

interface QualifiedEmployeesTableProps {
  employees: Employee[];
  isLoading: boolean;
}

export function QualifiedEmployeesTable({ employees, isLoading }: QualifiedEmployeesTableProps) {
  if (isLoading) {
    return (
      <div className="py-10">
        <QualificationsLoadingState />
      </div>
    );
  }

  // Helper function to format full name
  const formatFullName = (employee: Employee): string => {
    if (employee.firstName && employee.lastName) {
      return `${employee.firstName} ${employee.lastName}`;
    }
    return employee.name || "Unknown Name";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Job Title</TableHead>
          <TableHead>Division</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.length > 0 ? (
          employees.map(employee => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{formatFullName(employee)}</TableCell>
              <TableCell>{employee.jobTitle || "Member"}</TableCell>
              <TableCell>{employee.division || "Operations"}</TableCell>
              <TableCell>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  <span>Qualified</span>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
              No qualified volunteers found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

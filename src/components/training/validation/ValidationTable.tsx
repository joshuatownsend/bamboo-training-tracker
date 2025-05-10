
import React from "react";
import { format } from "date-fns";
import { ExternalLink, ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ValidationIssue, SortField, SortDirection } from "./types";

interface ValidationTableProps {
  issues: ValidationIssue[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export function ValidationTable({ issues, sortField, sortDirection, onSort }: ValidationTableProps) {
  // Function to open BambooHR training record
  const openInBambooHR = (employeeId: string, trainingId: string) => {
    window.open(`https://avfrd.bamboohr.com/app/settings/training/employee/${employeeId}/edit/${trainingId}`, '_blank');
  };

  // Helper function for sort header display
  const SortHeader = ({ field, label }: { field: SortField, label: string }) => {
    return (
      <TableHead 
        className="cursor-pointer hover:bg-muted/60 transition-colors"
        onClick={() => onSort(field)}
      >
        <div className="flex items-center justify-between">
          <span>{label}</span>
          {sortField === field && (
            sortDirection === 'asc' ? 
              <ArrowUp className="h-4 w-4 ml-1" /> : 
              <ArrowDown className="h-4 w-4 ml-1" />
          )}
        </div>
      </TableHead>
    );
  };

  if (issues.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No date validation issues found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <SortHeader field="employeeName" label="Employee Name" />
          <SortHeader field="trainingName" label="Training" />
          <SortHeader field="completionDate" label="Completion Date" />
          <SortHeader field="issueType" label="Issue" />
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((issue, index) => (
          <TableRow key={`${issue.employeeId}-${issue.trainingId}-${index}`}>
            <TableCell>{issue.employeeName}</TableCell>
            <TableCell>{issue.trainingName}</TableCell>
            <TableCell>
              {format(new Date(issue.completionDate), "MMM d, yyyy")}
            </TableCell>
            <TableCell>
              <Badge variant={issue.issueType === 'future' ? 'secondary' : 'destructive'}>
                {issue.issueType === 'future' 
                  ? 'Date is in the future' 
                  : 'Date is before 1990'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openInBambooHR(issue.employeeId, issue.trainingId)}
                className="gap-1"
              >
                <ExternalLink className="h-4 w-4" /> 
                Edit in BambooHR
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

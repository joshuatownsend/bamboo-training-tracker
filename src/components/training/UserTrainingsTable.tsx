
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserTraining } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

interface UserTrainingsTableProps {
  trainings: UserTraining[];
}

export function UserTrainingsTable({ trainings }: UserTrainingsTableProps) {
  // Group trainings by category for better organization
  const groupedTrainings = trainings.reduce((acc, training) => {
    // Make sure to extract category as string
    const category = typeof training.trainingDetails?.category === 'string' 
      ? training.trainingDetails.category 
      : 'Uncategorized';
      
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(training);
    return acc;
  }, {} as Record<string, UserTraining[]>);

  // Get categories and sort them
  const categories = Object.keys(groupedTrainings).sort();

  // Function to format date with proper validation
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "N/A";
    
    try {
      const date = parseISO(dateStr);
      return isValid(date) ? format(date, "MMM d, yyyy") : dateStr;
    } catch (e) {
      // Handle non-ISO format dates (like MM/DD/YYYY)
      try {
        const date = new Date(dateStr);
        return isValid(date) ? format(date, "MMM d, yyyy") : dateStr;
      } catch {
        return dateStr;
      }
    }
  };

  // Enhanced function to safely get text value from any value type
  const safeTextValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "object") {
      // Special handling for objects with id and name properties
      if (value && 'id' in value && 'name' in value) {
        return typeof value.name === 'string' ? value.name : `ID: ${value.id}`;
      }
      // Handle specific object properties we know about
      if ('name' in value && value.name) return safeTextValue(value.name);
      if ('title' in value && value.title) return safeTextValue(value.title);
      if ('id' in value && value.id) return `ID: ${safeTextValue(value.id)}`;
      
      // Last resort for objects - stringify with error handling
      try {
        return JSON.stringify(value);
      } catch (e) {
        return "[Object]";
      }
    }
    return String(value);
  };

  // Function to open BambooHR training page for the employee
  const openInBambooHR = (employeeId: any) => {
    // Make sure employeeId is a string
    const empId = safeTextValue(employeeId);
    window.open(`https://avfrd.bamboohr.com/employees/training/?id=${empId}&page=2109`, '_blank');
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-1/3">Training Course</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Completion Date</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No training records found. Try refreshing the data.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <React.Fragment key={`category-${category}`}>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableCell colSpan={5} className="font-medium py-2">
                    {safeTextValue(category)}
                  </TableCell>
                </TableRow>
                {groupedTrainings[category].map((training) => (
                  <TableRow key={training.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {safeTextValue(training.trainingDetails?.title) || `Training ${safeTextValue(training.trainingId || training.id)}`}
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
                ))}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default UserTrainingsTable;


import React, { useState } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useBambooHR from "@/hooks/useBambooHR";
import { Employee, UserTraining } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

// Define the validation rules for training completion dates
const MIN_VALID_DATE = new Date(1990, 0, 1); // January 1, 1990

interface ValidationIssue {
  employeeId: string;
  employeeName: string;
  trainingId: string;
  trainingName: string;
  completionDate: string;
  issueType: 'past' | 'future';
}

const TrainingDataValidation = () => {
  const { useAllData } = useBambooHR();
  const { data, isLoading, error } = useAllData();

  // Function to identify validation issues
  const getValidationIssues = (): ValidationIssue[] => {
    if (!data || !data.employees || !data.completions || !data.trainings) return [];

    const now = new Date();
    const issues: ValidationIssue[] = [];
    
    // Build a map for quick lookups
    const employeeMap = new Map<string, Employee>();
    data.employees.forEach(employee => {
      employeeMap.set(employee.id, employee);
    });
    
    const trainingMap = new Map<string, string>();
    data.trainings.forEach(training => {
      trainingMap.set(training.id, training.title);
    });
    
    // Check completion dates
    data.completions.forEach(completion => {
      if (!completion.completionDate) return;
      
      const completionDate = new Date(completion.completionDate);
      const employee = employeeMap.get(completion.employeeId);
      const trainingName = trainingMap.get(completion.trainingId) || "Unknown Training";
      
      // Skip if we can't find the employee
      if (!employee) return;
      
      // Check if date is before minimum valid date
      if (completionDate < MIN_VALID_DATE) {
        issues.push({
          employeeId: completion.employeeId,
          employeeName: employee.name,
          trainingId: completion.trainingId,
          trainingName,
          completionDate: completion.completionDate,
          issueType: 'past'
        });
      }
      
      // Check if date is in the future
      else if (completionDate > now) {
        issues.push({
          employeeId: completion.employeeId,
          employeeName: employee.name,
          trainingId: completion.trainingId,
          trainingName,
          completionDate: completion.completionDate,
          issueType: 'future'
        });
      }
    });
    
    return issues;
  };

  // Function to open BambooHR training record
  const openInBambooHR = (employeeId: string, trainingId: string) => {
    window.open(`https://avfrd.bamboohr.com/app/settings/training/employee/${employeeId}/edit/${trainingId}`, '_blank');
  };
  
  // Get validation issues
  const validationIssues = getValidationIssues();
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <h3 className="text-lg font-medium">Error loading validation data</h3>
        <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Training Data Validation</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Date Validation Issues</CardTitle>
          <CardDescription>
            Training completion dates that are either before January 1, 1990 or in the future
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validationIssues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No date validation issues found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Training</TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationIssues.map((issue, index) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingDataValidation;


import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ArrowUp, ArrowDown } from "lucide-react";
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

type SortField = 'employeeName' | 'trainingName' | 'completionDate' | 'issueType';
type SortDirection = 'asc' | 'desc';

const TrainingDataValidation = () => {
  const { useAllData } = useBambooHR();
  const { data, isLoading, error } = useAllData();
  const [validationStats, setValidationStats] = useState({
    totalCompletions: 0,
    futureCompletions: 0,
    pastCompletions: 0
  });
  
  // Add sort state
  const [sortField, setSortField] = useState<SortField>('employeeName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Function to handle sort
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field clicked
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Function to identify validation issues
  const getValidationIssues = (): ValidationIssue[] => {
    if (!data || !data.employees || !data.completions || !data.trainings) {
      console.log("Missing required data for validation");
      return [];
    }

    const now = new Date();
    const issues: ValidationIssue[] = [];
    
    console.log(`Processing ${data.completions.length} completion records for validation`);
    
    // Build a map for quick lookups
    const employeeMap = new Map<string, Employee>();
    data.employees.forEach(employee => {
      employeeMap.set(employee.id, employee);
    });
    
    const trainingMap = new Map<string, string>();
    data.trainings.forEach(training => {
      trainingMap.set(training.id, training.title);
    });
    
    let futureCount = 0;
    let pastCount = 0;
    
    // Check completion dates
    data.completions.forEach(completion => {
      if (!completion.completionDate) return;
      
      const completionDate = new Date(completion.completionDate);
      const employee = employeeMap.get(completion.employeeId);
      const trainingName = trainingMap.get(completion.trainingId) || "Unknown Training";
      
      // Skip if we can't find the employee
      if (!employee) {
        console.log(`Skipping completion record - employee not found: ${completion.employeeId}`);
        return;
      }
      
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
        pastCount++;
      }
      
      // Check if date is in the future
      else if (completionDate > now) {
        console.log(`Found future date: ${completion.completionDate} for employee ${employee.name}, training ${trainingName}`);
        issues.push({
          employeeId: completion.employeeId,
          employeeName: employee.name,
          trainingId: completion.trainingId,
          trainingName,
          completionDate: completion.completionDate,
          issueType: 'future'
        });
        futureCount++;
      }
    });
    
    console.log(`Validation summary: ${issues.length} issues found (${futureCount} future dates, ${pastCount} past dates)`);
    
    setValidationStats({
      totalCompletions: data.completions.length,
      futureCompletions: futureCount,
      pastCompletions: pastCount
    });
    
    return issues;
  };

  // Function to open BambooHR training record
  const openInBambooHR = (employeeId: string, trainingId: string) => {
    window.open(`https://avfrd.bamboohr.com/app/settings/training/employee/${employeeId}/edit/${trainingId}`, '_blank');
  };
  
  // Get validation issues
  const validationIssues = getValidationIssues();
  
  // Apply sorting to issues
  const sortedIssues = [...validationIssues].sort((a, b) => {
    let comparison = 0;
    
    // Sort based on the selected field
    switch (sortField) {
      case 'employeeName':
        comparison = a.employeeName.localeCompare(b.employeeName);
        break;
      case 'trainingName':
        comparison = a.trainingName.localeCompare(b.trainingName);
        break;
      case 'completionDate':
        comparison = new Date(a.completionDate).getTime() - new Date(b.completionDate).getTime();
        break;
      case 'issueType':
        comparison = a.issueType.localeCompare(b.issueType);
        break;
      default:
        break;
    }
    
    // Apply sort direction
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Effects to re-run validation when data changes
  useEffect(() => {
    if (data) {
      console.log("Data loaded for validation:", {
        employees: data.employees?.length || 0,
        trainings: data.trainings?.length || 0,
        completions: data.completions?.length || 0
      });
    }
  }, [data]);
  
  // Helper function for sort header display
  const SortHeader = ({ field, label }: { field: SortField, label: string }) => {
    return (
      <TableHead 
        className="cursor-pointer hover:bg-muted/60 transition-colors"
        onClick={() => handleSort(field)}
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-muted rounded-lg p-4">
          <p className="text-muted-foreground text-sm">Total Completions</p>
          <p className="text-2xl font-bold">{validationStats.totalCompletions}</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-muted-foreground text-sm">Future Dates</p>
          <p className="text-2xl font-bold">{validationStats.futureCompletions}</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-muted-foreground text-sm">Pre-1990 Dates</p>
          <p className="text-2xl font-bold">{validationStats.pastCompletions}</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Date Validation Issues</CardTitle>
          <CardDescription>
            Training completion dates that are either before January 1, 1990 or in the future
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedIssues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No date validation issues found.
            </div>
          ) : (
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
                {sortedIssues.map((issue, index) => (
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

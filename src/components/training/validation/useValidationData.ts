
import { useState, useEffect } from "react";
import { Employee, Training, TrainingCompletion } from "@/lib/types";
import { ValidationIssue, ValidationStats, SortField, SortDirection } from "./types";

// Define the validation rules for training completion dates
const MIN_VALID_DATE = new Date(1990, 0, 1); // January 1, 1990

export function useValidationData(
  employees?: Employee[], 
  trainings?: { id: string; title: string }[], 
  completions?: TrainingCompletion[]
) {
  const [validationStats, setValidationStats] = useState<ValidationStats>({
    totalCompletions: 0,
    futureCompletions: 0,
    pastCompletions: 0
  });
  
  const [sortField, setSortField] = useState<SortField>('employeeName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

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
  useEffect(() => {
    if (!employees || !completions || !trainings) {
      console.log("Missing required data for validation");
      setValidationIssues([]);
      return;
    }

    const now = new Date();
    const issues: ValidationIssue[] = [];
    
    console.log(`Processing ${completions.length} completion records for validation`);
    
    // Build a map for quick lookups
    const employeeMap = new Map<string, Employee>();
    employees.forEach(employee => {
      employeeMap.set(employee.id, employee);
    });
    
    const trainingMap = new Map<string, string>();
    trainings.forEach(training => {
      trainingMap.set(training.id, training.title);
    });
    
    let futureCount = 0;
    let pastCount = 0;
    
    // Check completion dates
    completions.forEach(completion => {
      if (!completion.completion_date) return;
      
      const completionDate = new Date(completion.completion_date);
      const employee = employeeMap.get(completion.employee_id);
      const trainingName = trainingMap.get(completion.training_id) || "Unknown Training";
      
      // Skip if we can't find the employee
      if (!employee) {
        console.log(`Skipping completion record - employee not found: ${completion.employee_id}`);
        return;
      }
      
      // Check if date is before minimum valid date
      if (completionDate < MIN_VALID_DATE) {
        issues.push({
          employeeId: completion.employee_id,
          employeeName: employee.name,
          trainingId: completion.training_id,
          trainingName,
          completionDate: completion.completion_date,
          issueType: 'past'
        });
        pastCount++;
      }
      
      // Check if date is in the future
      else if (completionDate > now) {
        console.log(`Found future date: ${completion.completion_date} for employee ${employee.name}, training ${trainingName}`);
        issues.push({
          employeeId: completion.employee_id,
          employeeName: employee.name,
          trainingId: completion.training_id,
          trainingName,
          completionDate: completion.completion_date,
          issueType: 'future'
        });
        futureCount++;
      }
    });
    
    console.log(`Validation summary: ${issues.length} issues found (${futureCount} future dates, ${pastCount} past dates)`);
    
    setValidationIssues(issues);
    setValidationStats({
      totalCompletions: completions.length,
      futureCompletions: futureCount,
      pastCompletions: pastCount
    });
    
  }, [employees, trainings, completions]);

  // Get sorted validation issues
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

  return {
    validationStats,
    sortedIssues,
    sortField,
    sortDirection,
    handleSort
  };
}

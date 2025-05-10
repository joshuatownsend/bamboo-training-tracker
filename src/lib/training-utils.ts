
import { parseISO, isValid, format } from "date-fns";
import { UserTraining } from "@/lib/types";

// Enhanced function to safely get text value from any value type
export const safeTextValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();
  if (typeof value === "object") {
    // Special handling for objects with id and name properties
    if (value && 'id' in value && 'name' in value) {
      return typeof value.name === 'string' ? value.name : `ID: ${String(value.id)}`;
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

// Function to format date with proper validation
export const formatDate = (dateStr: string | undefined): string => {
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

// Group trainings by category for better organization
export const groupTrainingsByCategory = (trainings: UserTraining[]): Record<string, UserTraining[]> => {
  return trainings.reduce((acc, training) => {
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
};

// Function to open BambooHR training page for the employee
export const openInBambooHR = (employeeId: any) => {
  // Make sure employeeId is a string
  const empId = safeTextValue(employeeId);
  window.open(`https://avfrd.bamboohr.com/employees/training/?id=${empId}&page=2109`, '_blank');
};

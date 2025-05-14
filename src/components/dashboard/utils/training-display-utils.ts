
import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns";
import { TrainingCompletion } from "@/lib/types";

/**
 * Safely formats a date string, preserving the original string if formatting fails
 * @param dateString The date string to format
 * @returns A formatted date string or the original string if formatting fails
 */
export const formatCompletionDate = (dateString: string | undefined): string => {
  // Added more logging to debug date formatting issues
  console.log("Formatting completion date:", dateString);
  
  // Only show "No date" if the date string is actually missing
  if (!dateString) {
    console.log("Date string is empty or undefined");
    return "No date";
  }
  
  try {
    // Always attempt to create a Date object
    const date = new Date(dateString);
    
    // Log the parsed date to verify conversion
    console.log("Parsed date:", date);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date after parsing:", dateString);
      return dateString; // Return the original if parsing failed
    }
    
    // Try to format with date-fns
    const formatted = format(date, "MMM d, yyyy");
    console.log("Formatted date result:", formatted);
    return formatted;
  } catch (err) {
    // If format fails, log the error but still show the raw date string
    console.warn("Error formatting date:", err, "Raw date:", dateString);
    return dateString; // Return the original string so user can see the problematic date
  }
};

/**
 * Gets a training name from a completion record with proper fallbacks
 * Checks multiple possible sources of training name data
 */
export const getTrainingName = (
  completion: TrainingCompletion, 
  trainingNamesMap: Record<string, string>, 
  trainingTypeNames: Record<string, string>,
  trainings: any[]
): string => {
  const trainingId = completion.trainingId;
  
  // PRIORITY 1: Use directly fetched names from database (most reliable)
  if (trainingNamesMap[trainingId]) {
    return trainingNamesMap[trainingId];
  }
  
  // PRIORITY 2: Use the training data that came with the completion (from join)
  if (completion.trainingData?.name) {
    return completion.trainingData.name;
  }
  
  // PRIORITY 3: Use the names from the training types hook
  if (trainingTypeNames[trainingId]) {
    return trainingTypeNames[trainingId];
  }
  
  // PRIORITY 4: Look in the trainings array
  const training = trainings.find(t => t.id === trainingId);
  if (training?.title) {
    return training.title;
  }
  
  // If we got here, log the issue for debugging
  console.warn(`Could not resolve name for training ID: ${trainingId}`, {
    directNamesAvailable: Object.keys(trainingNamesMap).length,
    hookNamesAvailable: Object.keys(trainingTypeNames).length,
    trainingDataPresent: !!completion.trainingData,
    trainingsArraySize: trainings?.length || 0
  });
  
  // Default fallback - more descriptive than just ID
  return `Unknown Training (ID: ${trainingId})`;
};

/**
 * Gets initials from a name
 * @param name Full name
 * @returns First two initials
 */
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

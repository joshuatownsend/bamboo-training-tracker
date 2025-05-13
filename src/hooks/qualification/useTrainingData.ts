
import { useEffect, useMemo } from "react";
import useEmployeeCache from "@/hooks/useEmployeeCache";
import { supabase } from "@/integrations/supabase/client";
import { Training, TrainingCompletion } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function useTrainingData(employeeId?: string) {
  const { 
    trainings, 
    isTrainingsLoading,
    completions,
    isCompletionsLoading
  } = useEmployeeCache();
  
  const { toast } = useToast();

  // Filter completions for specific employee if employeeId is provided
  const employeeCompletions = useMemo(() => {
    if (!employeeId || !completions) return [];
    
    return completions.filter(completion => 
      completion.employeeId === employeeId
    );
  }, [employeeId, completions]);
  
  // Get the unique training IDs from the employee's completions
  const completedTrainingIds = useMemo(() => {
    return new Set(employeeCompletions.map(completion => completion.trainingId));
  }, [employeeCompletions]);
  
  // Find training objects that correspond to the completed trainings
  const completedTrainings = useMemo(() => {
    if (!trainings) return [];
    
    return trainings.filter(training => 
      completedTrainingIds.has(training.id)
    );
  }, [trainings, completedTrainingIds]);
  
  // Get the training details for a specific ID
  const getTrainingById = (trainingId: string): Training | undefined => {
    return trainings?.find(t => t.id === trainingId);
  };
  
  // Debug output
  useEffect(() => {
    if (employeeId && completedTrainings.length > 0) {
      console.log(`Employee ${employeeId} has ${completedTrainings.length} completed trainings`);
    }
  }, [employeeId, completedTrainings]);
  
  return {
    trainings,
    isTrainingsLoading,
    completions,
    isCompletionsLoading,
    employeeCompletions,
    completedTrainings,
    completedTrainingIds,
    getTrainingById
  };
}

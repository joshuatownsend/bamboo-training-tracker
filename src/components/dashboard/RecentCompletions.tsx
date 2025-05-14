
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Employee, Training, TrainingCompletion } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useTrainingTypeNames } from "@/hooks/useTrainingTypeNames";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RecentCompletionsProps {
  completions: TrainingCompletion[];
  employees: Employee[];
  trainings: Training[];
}

export function RecentCompletions({ 
  completions,
  employees,
  trainings
}: RecentCompletionsProps) {
  // State for direct database training names
  const [trainingNamesMap, setTrainingNamesMap] = useState<Record<string, string>>({});
  
  // Log data for debugging
  console.log("RecentCompletions component received:", { 
    completionsCount: completions?.length || 0, 
    employeesCount: employees?.length || 0,
    trainingsCount: trainings?.length || 0
  });

  // Use our custom hook to get training names
  const { trainingTypeNames, isLoadingNames } = useTrainingTypeNames(completions);
  
  // Fetch actual training names directly from bamboo_training_types
  useEffect(() => {
    const fetchTrainingNames = async () => {
      // Extract all unique training IDs from completions
      const trainingIds = [...new Set(completions.map(c => c.trainingId))]
        .filter(Boolean)
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id));
      
      if (trainingIds.length === 0) return;
      
      try {
        // IMPROVED: Direct fetch of training names with better logging
        console.log(`Fetching training names for ${trainingIds.length} unique IDs:`, trainingIds);
        
        const { data, error } = await supabase
          .from('bamboo_training_types')
          .select('id, name')
          .in('id', trainingIds);
        
        if (error) {
          console.error('Error fetching training names:', error);
          return;
        }
        
        // Create a mapping of ID to name
        const namesMap = data.reduce((acc, item) => {
          acc[String(item.id)] = item.name;
          return acc;
        }, {} as Record<string, string>);
        
        setTrainingNamesMap(namesMap);
        console.log(`Fetched ${data.length} training names for display`, namesMap);
        
        // ADDED: Log any IDs that couldn't be resolved
        const missingIds = trainingIds.filter(id => !namesMap[id]);
        if (missingIds.length > 0) {
          console.warn(`Could not find names for ${missingIds.length} training IDs:`, missingIds);
        }
      } catch (error) {
        console.error('Error in fetchTrainingNames:', error);
      }
    };
    
    fetchTrainingNames();
  }, [completions]);
  
  if (!completions?.length) {
    console.warn("No completions data provided to RecentCompletions component");
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Completions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-sm text-muted-foreground">No recent completions found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get most recent 10 completions
  const recentCompletions = [...completions]
    .sort((a, b) => 
      new Date(b.completionDate || '').getTime() - new Date(a.completionDate || '').getTime()
    )
    .slice(0, 10);
    
  console.log(`Found ${recentCompletions.length} recent completions to display`);
  
  if (!recentCompletions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Completions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-sm text-muted-foreground">No completed trainings found</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // IMPROVED: Enhanced function to get training name from ID with better prioritization and logging
  const getTrainingName = (completion: TrainingCompletion): string => {
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
  
  // Function to format date or show meaningful fallback
  const formatCompletionDate = (dateString: string | undefined): string => {
    if (!dateString) return "No date";
    
    try {
      const date = new Date(dateString);
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", dateString);
        return "Invalid date";
      }
      return format(date, "MMM d, yyyy");
    } catch (err) {
      console.error("Error formatting date:", err);
      return "Date error";
    }
  };
    
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Completions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentCompletions.map((completion) => {
            // Use the embedded data directly if available
            let employeeName = completion.employeeData?.name;
            
            // If still no data, use fallbacks from the completion itself
            if (!employeeName) {
              employeeName = "Unknown Employee";
            }
            
            // Create unique key from all available data
            const uniqueKey = `${completion.id || completion.employeeId}-${completion.trainingId}-${completion.completionDate}`;
            
            const initials = employeeName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2);
              
            return (
              <div key={uniqueKey} className="flex items-center">
                <Avatar className="h-9 w-9 mr-3">
                  <AvatarFallback>{initials || "??"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{employeeName}</p>
                  <p className="text-xs text-muted-foreground">{getTrainingName(completion)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatCompletionDate(completion.completionDate)}
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentCompletions;

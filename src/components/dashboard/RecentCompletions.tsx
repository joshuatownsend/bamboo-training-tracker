
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Employee, Training, TrainingCompletion } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useTrainingTypeNames } from "@/hooks/useTrainingTypeNames";

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
  // Log data for debugging
  console.log("RecentCompletions component received:", { 
    completionsCount: completions?.length || 0, 
    employeesCount: employees?.length || 0,
    trainingsCount: trainings?.length || 0
  });

  // Use our custom hook to get training names
  const { trainingTypeNames, isLoadingNames } = useTrainingTypeNames(completions);
  
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
  
  // Function to get training name from ID
  const getTrainingName = (completion: TrainingCompletion): string => {
    // First check if we already have the name in the joined data
    if (completion.trainingData?.name) {
      return completion.trainingData.name;
    }
    
    // Next, try to find the name in our trainingTypeNames map
    const trainingId = completion.trainingId;
    if (trainingTypeNames[trainingId]) {
      return trainingTypeNames[trainingId];
    }
    
    // If all else fails, try to find it in the trainings array
    const training = trainings.find(t => t.id === trainingId);
    if (training) {
      return training.title;
    }
    
    // Default fallback
    return `Training ${trainingId}`;
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

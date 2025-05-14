
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Employee, Training, TrainingCompletion } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

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
            let trainingTitle = completion.trainingData?.name;
            
            // If still no data, use fallbacks from the completion itself
            if (!employeeName) {
              employeeName = "Unknown Employee";
            }
            
            if (!trainingTitle) {
              trainingTitle = "Unknown Training";
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
                  <p className="text-xs text-muted-foreground">{trainingTitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {completion.completionDate ? format(new Date(completion.completionDate), "MMM d, yyyy") : "No date"}
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

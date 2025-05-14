
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
      new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
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
            // First try to use the embedded joined data if available
            let employeeName = completion.employeeData?.name;
            let trainingTitle = completion.trainingData?.name;
            
            // If not available, fall back to looking up from the arrays
            if (!employeeName || !trainingTitle) {
              // Try to find the employee and training from the arrays using string IDs
              const employee = employees.find(e => e.id === completion.employeeId ||
                                                  e.bambooEmployee_id === completion.employeeId);
              const training = trainings.find(t => t.id === completion.trainingId);
              
              // If still not found, try numeric comparison as fallback
              if (!employee) {
                const numEmployeeId = parseInt(completion.employeeId);
                const employeeWithNumericId = employees.find(e => 
                  e.bambooEmployeeId === numEmployeeId.toString() || 
                  e.id === numEmployeeId.toString()
                );
                if (employeeWithNumericId) {
                  employeeName = employeeWithNumericId.name;
                }
              } else {
                employeeName = employee.name;
              }
              
              if (!training) {
                const numTrainingId = parseInt(completion.trainingId);
                const trainingWithNumericId = trainings.find(t => t.id === numTrainingId.toString());
                if (trainingWithNumericId) {
                  trainingTitle = trainingWithNumericId.title;
                }
              } else {
                trainingTitle = training.title;
              }
            }
            
            // Skip if we still can't find the data
            if (!employeeName || !trainingTitle) {
              console.warn(`Missing data for completion: ${completion.id}, employee: ${employeeName}, training: ${trainingTitle}`);
              return null;
            }
            
            const initials = employeeName
              .split(" ")
              .map((n) => n[0])
              .join("");
              
            return (
              <div key={completion.id} className="flex items-center">
                <Avatar className="h-9 w-9 mr-3">
                  <AvatarFallback>{initials}</AvatarFallback>
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
          }).filter(Boolean)}
          
          {/* Show placeholder if we filtered out all completions due to missing data */}
          {recentCompletions.filter(Boolean).length === 0 && (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-sm text-muted-foreground">Could not display completions due to missing data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentCompletions;

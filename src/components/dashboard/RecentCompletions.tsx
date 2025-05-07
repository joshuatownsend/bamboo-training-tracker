
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
  // Get most recent completions
  const recentCompletions = [...completions]
    .filter(c => c.status === "completed" && c.completionDate)
    .sort((a, b) => 
      new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
    )
    .slice(0, 5);
    
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Completions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentCompletions.map((completion) => {
            const employee = employees.find(e => e.id === completion.employeeId);
            const training = trainings.find(t => t.id === completion.trainingId);
            
            if (!employee || !training) return null;
            
            const initials = employee.name
              .split(" ")
              .map((n) => n[0])
              .join("");
              
            return (
              <div key={completion.id} className="flex items-center">
                <Avatar className="h-9 w-9 mr-3">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">{training.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(completion.completionDate), "MMM d, yyyy")}
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

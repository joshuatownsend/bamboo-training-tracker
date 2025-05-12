
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Employee, Training, TrainingCompletion } from "@/lib/types";

interface EmployeeTableRowProps {
  employee: Employee;
  requiredTrainings: Training[];
  employeeCompletions: TrainingCompletion[];
}

export function EmployeeTableRow({ 
  employee, 
  requiredTrainings, 
  employeeCompletions 
}: EmployeeTableRowProps) {
  // Calculate training status
  const completed = employeeCompletions.filter(c => 
    c && c.status === "completed"
  ).length;
  
  const expired = employeeCompletions.filter(c => 
    c && c.status === "expired"
  ).length;
  
  const total = requiredTrainings.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 100;
  
  let badgeColor = "bg-green-500";
  if (progress < 70) badgeColor = "bg-red-500";
  else if (progress < 100) badgeColor = "bg-yellow-500";
  
  // Get name from various possible fields in the employee record
  const employeeName = employee.name || 
                  employee.displayName || 
                  `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 
                  'Unknown';
  
  // Get employee position/title from various possible fields
  const employeePosition = employee.position || 
                     employee.jobTitle || 
                     'No Position';

  // Get initials for avatar
  const initials = employeeName
    ? employeeName
        .split(" ")
        .map((n) => n && n[0])
        .filter(Boolean)
        .join("")
    : "??";

  // Create BambooHR profile URL
  const bambooHRProfileUrl = `https://avfrd.bamboohr.com/employees/employee.php?id=${employee.id}`;
    
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 bg-yellow-200 text-black border border-yellow-400">
            <AvatarFallback className="bg-yellow-200 text-black">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{employeeName}</div>
            <div className="text-xs text-muted-foreground">{employee.email || employee.workEmail || 'No Email'}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>{employeePosition}</TableCell>
      <TableCell>{employee.division || employee.department || 'Unassigned'}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${badgeColor}`} />
          <span>{completed}/{total} Completed</span>
          {expired > 0 && (
            <Badge variant="destructive" className="ml-2">
              {expired} Expired
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button asChild size="sm" variant="outline">
          <a href={bambooHRProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
            BambooHR Profile <ExternalLink className="h-3.5 w-3.5 ml-0.5" />
          </a>
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default EmployeeTableRow;

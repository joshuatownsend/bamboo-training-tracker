
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Employee, Training, TrainingCompletion } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface EmployeeTableProps {
  employees: Employee[];
  trainings: Training[];
  completions: TrainingCompletion[];
}

export function EmployeeTable({ 
  employees, 
  trainings,
  completions 
}: EmployeeTableProps) {
  if (!employees || !employees.length) {
    return (
      <div className="rounded-md border bg-white p-8 text-center">
        <p className="text-muted-foreground">No employees found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Hire Date</TableHead>
            <TableHead>Training Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => {
            // Calculate training status
            const requiredTrainings = trainings.filter(t => 
              t.requiredFor?.includes(employee.department || '')
            ) || [];
            
            const employeeCompletions = completions.filter(c => 
              c.employeeId === employee.id
            ) || [];
            
            const completed = employeeCompletions.filter(c => 
              c.status === "completed"
            ).length;
            
            const expired = employeeCompletions.filter(c => 
              c.status === "expired"
            ).length;
            
            const total = requiredTrainings.length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 100;
            
            let badgeColor = "bg-green-500";
            if (progress < 70) badgeColor = "bg-red-500";
            else if (progress < 100) badgeColor = "bg-yellow-500";
            
            // Get initials for avatar
            const initials = employee.name
              ? employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : "??";
              
            return (
              <TableRow key={employee.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{employee.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{employee.position || 'No Position'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{employee.department || 'Unassigned'}</TableCell>
                <TableCell>{employee.hireDate ? format(new Date(employee.hireDate), "MMM d, yyyy") : 'Unknown'}</TableCell>
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
                    <Link to={`/employees/${employee.id}`}>View Details</Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default EmployeeTable;


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Employee, Training, TrainingCompletion } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

interface EmployeeTableProps {
  employees: Employee[];
  trainings: Training[];
  completions: TrainingCompletion[];
}

export function EmployeeTable({ 
  employees = [], 
  trainings = [],
  completions = [],
}: EmployeeTableProps) {
  // For debugging
  useEffect(() => {
    console.log("EmployeeTable received employees:", employees.length);
    console.log("First few employees:", employees.slice(0, 3));
  }, [employees]);

  // Early return with message if no employees available
  if (!employees || employees.length === 0) {
    return (
      <div className="rounded-md border bg-white p-8 text-center">
        <p className="text-muted-foreground">No employees found</p>
      </div>
    );
  }

  // Filter out any invalid employee records (should have id at minimum)
  const validEmployees = employees.filter(employee => employee && employee.id);
  
  if (validEmployees.length === 0) {
    return (
      <div className="rounded-md border bg-white p-8 text-center">
        <p className="text-muted-foreground">No valid employee records found</p>
        <p className="text-xs text-muted-foreground mt-2">Data may be missing required fields</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white">
      <div className="p-4 flex justify-between border-b">
        <div className="text-sm text-muted-foreground">
          Showing {validEmployees.length} employees
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Division</TableHead>
            <TableHead>Training Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validEmployees.map((employee) => {
            // Calculate training status with null checks
            const requiredTrainings = (trainings || []).filter(t => 
              t && t.requiredFor?.includes(employee.division || '')
            );
            
            const employeeCompletions = (completions || []).filter(c => 
              c && c.employeeId === employee.id
            );
            
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

            // Get initials for avatar with safety checks
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
              <TableRow key={employee.id}>
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
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default EmployeeTable;

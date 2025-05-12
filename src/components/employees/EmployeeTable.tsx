
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Employee, Training, TrainingCompletion } from "@/lib/types";
import { useEffect } from "react";
import { EmployeeTableRow } from "./EmployeeTableRow";
import { EmptyEmployeeState } from "./EmptyEmployeeState";

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

  // Filter out any invalid employee records (should have id at minimum)
  const validEmployees = employees.filter(employee => employee && employee.id);
  
  if (!employees || employees.length === 0 || validEmployees.length === 0) {
    return <EmptyEmployeeState hasEmployees={employees.length > 0} />;
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
            // Find trainings required for this employee's division
            const requiredTrainings = (trainings || []).filter(t => 
              t && t.required_for?.includes(employee.division || '')
            );
            
            // Find completions for this employee
            const employeeCompletions = (completions || []).filter(c => 
              c && c.employee_id === employee.id
            );
            
            return (
              <EmployeeTableRow
                key={employee.id}
                employee={employee}
                requiredTrainings={requiredTrainings}
                employeeCompletions={employeeCompletions}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default EmployeeTable;

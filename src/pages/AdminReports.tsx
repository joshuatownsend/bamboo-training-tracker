
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { employees, positions, trainings, trainingCompletions } from "@/lib/data";
import { checkPositionQualification, getEmployeesQualifiedForPosition } from "@/lib/qualifications";
import { Badge } from "@/components/ui/badge";
import { Search, Users, UserCheck } from "lucide-react";

export default function AdminReports() {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [requirementType, setRequirementType] = useState<"county" | "avfrd">("avfrd");
  const [activeTab, setActiveTab] = useState("employee-lookup");
  
  // Filter employees based on search
  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(employeeSearch.toLowerCase())
  );
  
  // Get the selected employee
  const selectedEmployeeData = employees.find((e) => e.id === selectedEmployee);
  
  // Get qualification for selected employee
  const employeeQualifications = selectedEmployee
    ? positions.map((position) => {
        const qualification = checkPositionQualification(
          selectedEmployee,
          position.id,
          positions,
          trainings,
          trainingCompletions
        );
        return {
          ...position,
          countyQualified: qualification?.isQualifiedCounty || false,
          avfrdQualified: qualification?.isQualifiedAVFRD || false
        };
      })
    : [];
  
  // Get employees qualified for selected position
  const qualifiedEmployees = selectedPosition
    ? getEmployeesQualifiedForPosition(
        selectedPosition,
        employees,
        positions,
        trainings,
        trainingCompletions,
        requirementType
      )
    : [];
  
  // Get employees qualified by county but not by AVFRD
  const eligibleButNotReleased = selectedPosition
    ? employees.filter((employee) => {
        const qualification = checkPositionQualification(
          employee.id,
          selectedPosition,
          positions,
          trainings,
          trainingCompletions
        );
        return qualification?.isQualifiedCounty && !qualification?.isQualifiedAVFRD;
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Reports</h1>
        <p className="text-muted-foreground">
          Generate reports on employee qualifications and training status
        </p>
      </div>

      <Tabs defaultValue="employee-lookup" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employee-lookup">Employee Lookup</TabsTrigger>
          <TabsTrigger value="position-qualified">Position Qualified</TabsTrigger>
          <TabsTrigger value="eligible-not-released">Eligible But Not Released</TabsTrigger>
        </TabsList>
        
        <TabsContent value="employee-lookup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Qualification Lookup</CardTitle>
              <CardDescription>
                Search for an employee to view their qualifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search employees..."
                    className="pl-8 bg-background"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                  />
                </div>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEmployeeData && (
                <div className="pt-4">
                  <div className="pb-4">
                    <h3 className="text-lg font-medium">{selectedEmployeeData.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedEmployeeData.position} - {selectedEmployeeData.department}
                    </p>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Position</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>County Qualified</TableHead>
                        <TableHead>AVFRD Qualified</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeQualifications.map((position) => (
                        <TableRow key={position.id}>
                          <TableCell className="font-medium">
                            {position.title}
                          </TableCell>
                          <TableCell>{position.department}</TableCell>
                          <TableCell>
                            <Badge
                              variant={position.countyQualified ? "default" : "outline"}
                              className={position.countyQualified ? "bg-green-500" : ""}
                            >
                              {position.countyQualified ? "Qualified" : "Not Qualified"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={position.avfrdQualified ? "default" : "outline"}
                              className={position.avfrdQualified ? "bg-green-500" : ""}
                            >
                              {position.avfrdQualified ? "Qualified" : "Not Qualified"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!selectedEmployee && (
                <div className="text-center py-4 text-muted-foreground">
                  Select an employee to view qualifications
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="position-qualified" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Position Qualification Report</CardTitle>
              <CardDescription>
                View all employees qualified for a specific position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Select a position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={requirementType} 
                  onValueChange={(value) => setRequirementType(value as "county" | "avfrd")}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Requirement type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="county">County Requirements</SelectItem>
                    <SelectItem value="avfrd">AVFRD Requirements</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedPosition && (
                <div className="pt-4">
                  <div className="pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">
                        {positions.find((p) => p.id === selectedPosition)?.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Showing employees qualified based on {requirementType === "county" ? "County" : "AVFRD"} requirements
                      </p>
                    </div>
                    <div className="flex items-center">
                      <UserCheck className="h-5 w-5 mr-1 text-primary" />
                      <span className="font-medium">{qualifiedEmployees.length} qualified</span>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {qualifiedEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.name}
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>{employee.position}</TableCell>
                        </TableRow>
                      ))}
                      {qualifiedEmployees.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4">
                            No qualified employees found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!selectedPosition && (
                <div className="text-center py-4 text-muted-foreground">
                  Select a position to view qualified employees
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="eligible-not-released" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eligible But Not Released</CardTitle>
              <CardDescription>
                Employees who meet County requirements but not AVFRD requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPosition && (
                <div className="pt-4">
                  <div className="pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">
                        {positions.find((p) => p.id === selectedPosition)?.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Showing employees who meet County requirements but not AVFRD requirements
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-1 text-primary" />
                      <span className="font-medium">{eligibleButNotReleased.length} eligible</span>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eligibleButNotReleased.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.name}
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>{employee.position}</TableCell>
                        </TableRow>
                      ))}
                      {eligibleButNotReleased.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4">
                            No eligible employees found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!selectedPosition && (
                <div className="text-center py-4 text-muted-foreground">
                  Select a position to view eligible employees
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

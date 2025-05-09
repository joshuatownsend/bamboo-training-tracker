import { useState, useEffect, useCallback } from "react";
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
import { positions, trainings, trainingCompletions } from "@/lib/data";
import { checkPositionQualification, getEmployeesQualifiedForPosition } from "@/lib/qualifications";
import { Badge } from "@/components/ui/badge";
import { Search, Users, UserCheck, RefreshCw, Loader2 } from "lucide-react";
import useBambooHR from "@/hooks/useBambooHR";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function AdminReports() {
  // Keep all state management at the top
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [requirementType, setRequirementType] = useState<"county" | "avfrd">("avfrd");
  const [activeTab, setActiveTab] = useState("employee-lookup");
  const [open, setOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Improved debouncing - longer delay for better performance
  const debouncedSearch = useDebounce(employeeSearch, 500);
  
  // Get data from BambooHR
  const { isConfigured, useAllData } = useBambooHR();
  const { data, isLoading, refetch } = useAllData();
  
  // Use BambooHR data if available, otherwise fall back to mock data
  const employees = (isConfigured && data?.employees && data.employees.length > 0) 
    ? data.employees 
    : [];
  
  // Optimized employee filtering function - memoize with useCallback to prevent recreation
  const getFilteredEmployees = useCallback(() => {
    // When no search term, return limited results
    if (!debouncedSearch.trim()) {
      return employees.slice(0, 20);
    }
    
    // When searching, filter efficiently and limit results
    return employees
      .filter(employee => 
        employee.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .slice(0, 30);
  }, [employees, debouncedSearch]);

  // Pre-compute filtered employees to improve render performance
  const filteredEmployees = getFilteredEmployees();
  
  // Find the selected employee data
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

  // Handle refresh BambooHR data
  const handleRefresh = () => {
    refetch();
  };
  
  // Reset search when opening/closing the dropdown to avoid performance issues
  useEffect(() => {
    if (!open) {
      // Delay clearing to prevent flashes during animation
      const timer = setTimeout(() => setEmployeeSearch(""), 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Reports</h1>
        <p className="text-muted-foreground">
          Generate reports on employee qualifications and training status
        </p>
      </div>

      {!isConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
          <p className="text-sm">
            BambooHR integration is not configured. Using mock data. 
            Administrators can configure BambooHR in the Admin Settings.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh Data
        </Button>
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
                  {/* Simplified employee selector with improved performance */}
                  <Popover 
                    open={open} 
                    onOpenChange={setOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {selectedEmployee
                          ? selectedEmployeeData?.name || "Select an employee..."
                          : "Select an employee..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="border-b px-3 py-2">
                        <Input
                          placeholder="Search employees..."
                          value={employeeSearch}
                          onChange={(e) => {
                            setEmployeeSearch(e.target.value);
                            setIsSearching(true);
                          }}
                          className="h-8 w-full border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {isLoading ? (
                          <div className="p-4 space-y-2">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                          </div>
                        ) : filteredEmployees.length === 0 ? (
                          <div className="py-6 text-center text-sm">
                            {isSearching ? "No employee found." : "No employees available."}
                          </div>
                        ) : (
                          filteredEmployees.map((employee) => (
                            <div
                              key={employee.id}
                              className="cursor-pointer relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                              onClick={() => {
                                setSelectedEmployee(employee.id);
                                setOpen(false);
                              }}
                            >
                              <span>{employee.name}</span>
                              {employee.department && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {employee.department}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                        {employees.length > filteredEmployees.length && debouncedSearch === "" && (
                          <div className="p-2 text-xs text-center text-muted-foreground">
                            Showing first {filteredEmployees.length} of {employees.length} employees. Type to search more.
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Keep existing code for the employee details section */}
              {isLoading && !selectedEmployeeData ? (
                <div className="pt-4 space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : selectedEmployeeData ? (
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
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Select an employee to view qualifications
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Keep existing code for other tabs */}
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

              {isLoading ? (
                <div className="pt-4 space-y-4">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : selectedPosition ? (
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
              ) : (
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

              {isLoading ? (
                <div className="pt-4 space-y-4">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : selectedPosition ? (
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
              ) : (
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

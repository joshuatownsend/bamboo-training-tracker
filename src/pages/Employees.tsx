
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PlusCircle, Search, RefreshCw, AlertTriangle } from "lucide-react";
import EmployeeTable from "@/components/employees/EmployeeTable";
import { useState, useEffect } from "react";
import useBambooHR from "@/hooks/useBambooHR";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Employee, Training, TrainingCompletion } from "@/lib/types";

// Import mock data for fallback
import { employees as mockEmployees, trainings as mockTrainings, trainingCompletions as mockCompletions } from "@/lib/data";

const Employees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  
  // Get data from BambooHR or use mock data as fallback
  const { isConfigured, useAllData } = useBambooHR();
  const { data, isLoading, error, refetch, status } = useAllData();
  
  // Debug logging
  useEffect(() => {
    console.log('Employees page - Status:', status);
    console.log('Employees page - BambooHR configured:', isConfigured);
    console.log('BambooHR data loaded:', data ? 'Yes' : 'No');
    console.log('Is Loading:', isLoading);
    console.log('Error:', error);
    
    if (isLoading) {
      setLoadingMessage("Loading data from BambooHR...");
    } else {
      setLoadingMessage(null);
    }
    
    if (data) {
      console.log(`Employees: ${data.employees?.length || 0}, Trainings: ${data.trainings?.length || 0}, Completions: ${data.completions?.length || 0}`);
    }
  }, [data, isConfigured, isLoading, error, status]);
  
  // Use BambooHR data if available, otherwise fall back to mock data
  const employeesData: Employee[] = (isConfigured && data?.employees && data.employees.length > 0) ? data.employees : mockEmployees;
  const trainingsData: Training[] = (isConfigured && data?.trainings && data.trainings.length > 0) ? data.trainings : mockTrainings;
  const completionsData: TrainingCompletion[] = (isConfigured && data?.completions && data.completions.length > 0) ? data.completions : mockCompletions;
  
  // Get unique departments for filter
  const departments = [...new Set(employeesData?.map(e => e.department).filter(Boolean))];
  
  // Filter employees based on search and department
  const filteredEmployees = employeesData?.filter(employee => {
    const matchesSearch = employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          employee?.position?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || employee?.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  }) || [];
  
  const handleRefresh = () => {
    console.log('Manually refreshing BambooHR data');
    setLoadingMessage("Refreshing data from BambooHR...");
    refetch();
  };

  // Check if we're actually using mock data despite having BambooHR configured
  const usingMockDataDespiteConfig = isConfigured && (!data?.employees || data.employees.length === 0);
  
  console.log('Rendering Employees page with filtered employees count:', filteredEmployees.length);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>
      
      {!isConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
          <p className="text-sm">
            BambooHR integration is not configured. Using mock data. 
            Administrators can configure BambooHR in the Admin Settings.
          </p>
        </div>
      )}
      
      {loadingMessage && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md mb-4">
          <p className="text-sm flex items-center">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            {loadingMessage}
          </p>
        </div>
      )}
      
      {usingMockDataDespiteConfig && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">
                BambooHR is configured, but no data was returned.
              </p>
              <p className="text-sm mt-1">
                This could be due to connection issues, incorrect API credentials, or empty data in your BambooHR account.
              </p>
              <div className="mt-3">
                <Button asChild variant="outline" size="sm">
                  <Link to="/bamboo-troubleshooting" className="text-amber-800">
                    Run Connection Tests
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">
                Error loading employee data
              </p>
              <p className="text-sm mt-1">
                {error instanceof Error ? error.message : String(error)}
              </p>
              <div className="mt-3">
                <Button asChild variant="outline" size="sm">
                  <Link to="/bamboo-troubleshooting" className="text-red-800">
                    Troubleshoot Connection
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search employees..."
            className="w-full pl-8 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept as string} value={dept as string}>
                {dept as string}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <>
          {filteredEmployees.length > 0 ? (
            <EmployeeTable 
              employees={filteredEmployees} 
              trainings={trainingsData}
              completions={completionsData}
            />
          ) : (
            <div className="rounded-md border bg-white p-8 text-center">
              <p className="text-muted-foreground">No employees found matching your filters</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Employees;

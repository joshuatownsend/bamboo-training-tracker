
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, RefreshCw, AlertTriangle, Wrench, Stethoscope, Database } from "lucide-react";
import EmployeeTable from "@/components/employees/EmployeeTable";
import { useState, useEffect } from "react";
import useBambooHR from "@/hooks/useBambooHR";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Employee, Training, TrainingCompletion } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import useEmployeeCache from "@/hooks/useEmployeeCache";
import { useEmployeesCache } from "@/hooks/cache/useEmployeesCache";

// Import mock data for fallback only when absolutely necessary
import { employees as mockEmployees, trainings as mockTrainings, trainingCompletions as mockCompletions } from "@/lib/data";

const Employees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Check if BambooHR is configured
  const { isConfigured } = useBambooHR();
  
  // Get trainings and completions from cache
  const { 
    trainings: cachedTrainings,
    completions: cachedCompletions,
    isTrainingsLoading,
    isCompletionsLoading,
    syncStatus,
    refetchAll,
  } = useEmployeeCache();
  
  // Get employees directly from the employee_mappings table
  const {
    data: mappedEmployees,
    isLoading: isMappedEmployeesLoading,
    error: mappedEmployeesError,
    refetch: refetchMappedEmployees,
  } = useEmployeesCache();
  
  // Use direct BambooHR API as a fallback only
  const { useAllData } = useBambooHR();
  const { 
    data: directApiData, 
    isLoading: isDirectApiLoading, 
    error: directApiError 
  } = useAllData();
  
  // Debug logging
  useEffect(() => {
    console.log('Employees page - BambooHR configured:', isConfigured);
    console.log('Employees page - Mapped employees loaded:', mappedEmployees?.length > 0 ? 'Yes' : 'No');
    console.log('Employees page - Trainings cache available:', cachedTrainings?.length > 0 ? 'Yes' : 'No');
    
    if (mappedEmployees?.length > 0) {
      console.log(`Found ${mappedEmployees.length} employees in employee_mappings table`);
    }
    
    // Set loading message based on state
    if (isMappedEmployeesLoading || isTrainingsLoading || isCompletionsLoading) {
      setLoadingMessage("Loading employee data...");
    } else {
      setLoadingMessage(null);
    }
    
  }, [
    mappedEmployees, 
    isConfigured, 
    isMappedEmployeesLoading, 
    isTrainingsLoading, 
    isCompletionsLoading, 
    cachedTrainings
  ]);
  
  // Determine which employees to use (prioritize mapped data)
  const employeesData: Employee[] = (mappedEmployees && mappedEmployees.length > 0) 
    ? mappedEmployees
    : (!isConfigured || directApiError) 
      ? mockEmployees 
      : (directApiData?.employees || []);
    
  // For trainings and completions, use cache or direct API
  const trainingsData: Training[] = (cachedTrainings && cachedTrainings.length > 0) 
    ? cachedTrainings
    : (!isConfigured || directApiError) 
      ? mockTrainings 
      : (directApiData?.trainings || []);
    
  const completionsData: TrainingCompletion[] = (cachedCompletions && cachedCompletions.length > 0) 
    ? cachedCompletions
    : (!isConfigured || directApiError) 
      ? mockCompletions 
      : (directApiData?.completions || []);
  
  // Get unique divisions for filter
  const divisions = [...new Set(employeesData?.filter(Boolean).map(e => e.division).filter(Boolean))];
  
  // Filter employees based on search and division
  const filteredEmployees = employeesData?.filter(employee => {
    if (!employee) return false;
    
    // Normalize data and search query for case-insensitive search
    const searchQueryLower = searchQuery.toLowerCase();
    const employeeName = employee.name || employee.displayName || ''; 
    const employeePosition = employee.position || employee.jobTitle || ''; 
    
    const matchesSearch = searchQuery === '' || 
      employeeName.toLowerCase().includes(searchQueryLower) ||
      employeePosition.toLowerCase().includes(searchQueryLower);
      
    const matchesDivision = departmentFilter === "all" || employee.division === departmentFilter;
    
    return matchesSearch && matchesDivision;
  }) || [];
  
  // Function to refresh data
  const handleRefresh = () => {
    console.log('Manually refreshing employee data');
    setLoadingMessage("Refreshing data...");
    
    // Refresh both employees and training data
    Promise.all([
      refetchMappedEmployees(),
      refetchAll()
    ]).then(() => {
      setLoadingMessage(null);
      toast({
        title: "Refresh complete",
        description: "Employee data has been refreshed"
      });
    }).catch((error) => {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh failed",
        description: error?.message || "Failed to refresh employee data",
        variant: "destructive",
      });
      setLoadingMessage(null);
    });
  };

  // Check if we're using data from employee_mappings table
  const usingMappedData = mappedEmployees && mappedEmployees.length > 0;
  
  // Check if we're actually using mock data despite having BambooHR configured
  const usingMockDataDespiteConfig = isConfigured && 
    !usingMappedData && 
    (!directApiData?.employees || directApiData.employees.length === 0);
  
  const isLoading = isMappedEmployeesLoading || isTrainingsLoading || isCompletionsLoading;
  
  // Get the appropriate error
  const error = mappedEmployeesError || directApiError;
  
  // Get the last sync time
  const lastSyncTime = usingMappedData && mappedEmployees && mappedEmployees.length > 0 
    ? mappedEmployees[0].lastSync 
    : null;
  
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
      
      {usingMappedData && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            <div>
              <p className="text-sm font-medium">
                Using employee data from database
              </p>
              {lastSyncTime && (
                <p className="text-sm">
                  Last synced {new Date(lastSyncTime).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="bg-blue-100">
            <Link to="/admin-settings" className="text-blue-800 flex items-center">
              <RefreshCw className="h-4 w-4 mr-1" />
              Manage Employees
            </Link>
          </Button>
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
                BambooHR is configured, but no employee data was found in the database.
              </p>
              <p className="text-sm mt-1">
                Visit the Admin Settings page to sync employee data from BambooHR.
              </p>
              <div className="mt-3 flex gap-2">
                <Button asChild variant="outline" size="sm" className="bg-amber-100">
                  <Link to="/admin-settings" className="text-amber-800">
                    <Stethoscope className="h-4 w-4 mr-1" />
                    Admin Settings
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
              <div className="mt-3 flex gap-2">
                <Button asChild variant="outline" size="sm" className="bg-red-100">
                  <Link to="/bamboo-diagnostics" className="text-red-800">
                    <Wrench className="h-4 w-4 mr-1" />
                    API Diagnostics
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
            <SelectValue placeholder="All Divisions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Divisions</SelectItem>
            {divisions.map((div) => (
              <SelectItem key={div as string} value={div as string}>
                {div as string}
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

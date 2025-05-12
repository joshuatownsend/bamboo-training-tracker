import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, RefreshCw, AlertTriangle, Wrench, Stethoscope } from "lucide-react";
import EmployeeTable from "@/components/employees/EmployeeTable";
import { useState, useEffect } from "react";
import useBambooHR from "@/hooks/useBambooHR";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Employee, Training, TrainingCompletion } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import useEmployeeCache from "@/hooks/useEmployeeCache";

// Import our new enhanced employee data hook
import useEnhancedEmployeeData from "@/hooks/useEnhancedEmployeeData";

// Import mock data for fallback only when absolutely necessary
import { employees as mockEmployees, trainings as mockTrainings, trainingCompletions as mockCompletions } from "@/lib/data";

const Employees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Check if BambooHR is configured
  const { isConfigured } = useBambooHR();
  
  // Get trainings and completions from cache (still use this for now)
  const { 
    trainings: cachedTrainings,
    completions: cachedCompletions,
    isTrainingsLoading,
    isCompletionsLoading,
    syncStatus,
  } = useEmployeeCache();
  
  // Use our new enhanced employee data hook
  const {
    employees,
    isLoading: isEmployeesLoading,
    error: employeeError,
    refetch: refetchEmployees,
    triggerSync,
    lastSync
  } = useEnhancedEmployeeData();
  
  // Use direct BambooHR API as a fallback
  const { useAllData } = useBambooHR();
  const { data: directApiData, isLoading: isDirectApiLoading, error: directApiError, refetch: refetchDirectApi } = useAllData();
  
  // Debug logging
  useEffect(() => {
    console.log('Employees page - BambooHR configured:', isConfigured);
    console.log('Employees page - Enhanced employees loaded:', employees?.length > 0 ? 'Yes' : 'No');
    console.log('Employees page - Trainings cache available:', cachedTrainings?.length > 0 ? 'Yes' : 'No');
    console.log('Direct BambooHR API data loaded:', directApiData ? 'Yes' : 'No');
    
    if (directApiData) {
      console.log(`Direct API: Employees: ${directApiData.employees?.length || 0}, Trainings: ${directApiData.trainings?.length || 0}, Completions: ${directApiData.completions?.length || 0}`);
    }
    
    if (employees) {
      console.log(`Enhanced employees: ${employees.length}`);
    }
    
    // Set loading message based on state
    if (isEmployeesLoading || isTrainingsLoading || isCompletionsLoading || isDirectApiLoading) {
      setLoadingMessage("Loading employee data...");
    } else {
      setLoadingMessage(null);
    }
    
  }, [
    employees, 
    isConfigured, 
    isEmployeesLoading, 
    isTrainingsLoading, 
    isCompletionsLoading, 
    isDirectApiLoading, 
    directApiData,
    cachedTrainings
  ]);
  
  // Determine which employees to use (prioritize enhanced data over others)
  const employeesData: Employee[] = (employees && employees.length > 0) 
    ? employees
    : (cachedTrainings && cachedTrainings.length > 0) 
      ? [] // If we have cached trainings but no enhanced employees, use empty array as we're waiting for enhanced data
      : (!isConfigured || directApiError) ? mockEmployees : (directApiData?.employees || []);
    
  // For trainings and completions, continue using cache or direct API for now
  const trainingsData: Training[] = (cachedTrainings && cachedTrainings.length > 0) 
    ? cachedTrainings
    : (!isConfigured || directApiError) ? mockTrainings : (directApiData?.trainings || []);
    
  const completionsData: TrainingCompletion[] = (cachedCompletions && cachedCompletions.length > 0) 
    ? cachedCompletions
    : (!isConfigured || directApiError) ? mockCompletions : (directApiData?.completions || []);
  
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
    
    // Trigger the enhanced employee sync
    triggerSync().then(() => {
      setTimeout(() => {
        refetchEmployees();
        setLoadingMessage(null);
        toast({
          title: "Refresh complete",
          description: "Employee data has been refreshed"
        });
      }, 1000);
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

  // Check if we're using enhanced employee data
  const usingEnhancedData = employees && employees.length > 0;
  
  // Check if we're actually using mock data despite having BambooHR configured
  const usingMockDataDespiteConfig = isConfigured && 
    !usingEnhancedData && 
    (!directApiData?.employees || directApiData.employees.length === 0);
  
  // Check if we received partial data due to errors from direct API
  const hasPartialData = directApiData && 'partialData' in directApiData ? directApiData.partialData === true : false;
  
  const isLoading = isEmployeesLoading || isTrainingsLoading || isCompletionsLoading || isDirectApiLoading;
  
  // Get the error to display (prioritize enhanced data error)
  const error = employeeError || directApiError;
  
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
      
      {usingEnhancedData && lastSync && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Stethoscope className="h-5 w-5 mr-2" />
            <div>
              <p className="text-sm font-medium">
                Using enhanced employee data from BambooHR
              </p>
              <p className="text-sm">
                {`Last synced ${new Date(lastSync).toLocaleString()}`}
              </p>
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
                BambooHR is configured, but no employee data was returned.
              </p>
              <p className="text-sm mt-1">
                Try clicking the Refresh button to sync employee data from BambooHR.
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="bg-amber-100" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Sync Now
                </Button>
                <Button asChild variant="outline" size="sm" className="bg-amber-100">
                  <Link to="/bamboo-diagnostics" className="text-amber-800">
                    <Stethoscope className="h-4 w-4 mr-1" />
                    API Diagnostics
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {hasPartialData && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">
                Some BambooHR data could not be retrieved
              </p>
              <p className="text-sm mt-1">
                {directApiData && 'error' in directApiData ? directApiData.error : "Some API endpoints may be unavailable or timed out."}
              </p>
              <div className="mt-3 flex gap-2">
                <Button asChild variant="outline" size="sm" className="bg-amber-100">
                  <Link to="/bamboo-diagnostics" className="text-amber-800">
                    <Stethoscope className="h-4 w-4 mr-1" />
                    Diagnose API Issues
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
                <Button asChild variant="outline" size="sm">
                  <Link to="/bamboo-troubleshooting" className="text-red-800">
                    Troubleshoot Connection
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="bg-red-100">
                  <Link to="/bamboo-diagnostics" className="text-red-800">
                    <Wrench className="h-4 w-4 mr-1" />
                    Advanced Diagnostics
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

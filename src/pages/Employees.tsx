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

// Import mock data for fallback only when absolutely necessary
import { employees as mockEmployees, trainings as mockTrainings, trainingCompletions as mockCompletions } from "@/lib/data";

const Employees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get data from BambooHR or the cache
  const { isConfigured } = useBambooHR();
  const { 
    employees: cachedEmployees,
    trainings: cachedTrainings,
    completions: cachedCompletions,
    isEmployeesLoading: isCacheLoading,
    syncStatus,
    refetchAll,
    triggerSync
  } = useEmployeeCache();
  
  // Fallback to BambooHR direct API if needed
  const { useAllData } = useBambooHR();
  const { data, isLoading, error, refetch, status } = useAllData();
  
  // Debug logging
  useEffect(() => {
    console.log('Employees page - Status:', status);
    console.log('Employees page - BambooHR configured:', isConfigured);
    console.log('Employees page - Cache available:', cachedEmployees?.length > 0 ? 'Yes' : 'No');
    console.log('BambooHR direct data loaded:', data ? 'Yes' : 'No');
    console.log('Is Loading (direct API):', isLoading);
    console.log('Is Loading (cache):', isCacheLoading);
    console.log('Error:', error);
    
    if (data) {
      console.log(`Direct API: Employees: ${data.employees?.length || 0}, Trainings: ${data.trainings?.length || 0}, Completions: ${data.completions?.length || 0}`);
    }
    
    if (cachedEmployees) {
      console.log(`Cache: Employees: ${cachedEmployees?.length || 0}, Trainings: ${cachedTrainings?.length || 0}, Completions: ${cachedCompletions?.length || 0}`);
    }
    
    if (isLoading || isCacheLoading) {
      setLoadingMessage("Loading employee data...");
    } else {
      setLoadingMessage(null);
    }
  }, [data, isConfigured, isLoading, isCacheLoading, error, status, cachedEmployees, cachedTrainings, cachedCompletions]);
  
  // Use cache if available, otherwise fall back to direct API or mock data
  const employeesData: Employee[] = (cachedEmployees && cachedEmployees.length > 0) 
    ? cachedEmployees
    : (!isConfigured || error) ? mockEmployees : (data?.employees || []);
    
  const trainingsData: Training[] = (cachedTrainings && cachedTrainings.length > 0) 
    ? cachedTrainings
    : (!isConfigured || error) ? mockTrainings : (data?.trainings || []);
    
  const completionsData: TrainingCompletion[] = (cachedCompletions && cachedCompletions.length > 0) 
    ? cachedCompletions
    : (!isConfigured || error) ? mockCompletions : (data?.completions || []);
  
  // Get unique divisions for filter
  const divisions = [...new Set(employeesData?.filter(Boolean).map(e => e.division).filter(Boolean))];
  
  // Filter employees based on search and division
  const filteredEmployees = employeesData?.filter(employee => {
    if (!employee) return false;
    
    // Normalize data and search query for case-insensitive search
    const searchQueryLower = searchQuery.toLowerCase();
    const employeeName = employee.name || employee.displayName || ''; // Add displayName as fallback
    const employeePosition = employee.position || employee.jobTitle || ''; // Add jobTitle as fallback
    
    const matchesSearch = searchQuery === '' || 
      employeeName.toLowerCase().includes(searchQueryLower) ||
      employeePosition.toLowerCase().includes(searchQueryLower);
      
    const matchesDivision = departmentFilter === "all" || employee.division === departmentFilter;
    
    return matchesSearch && matchesDivision;
  }) || [];
  
  const handleRefresh = () => {
    console.log('Manually refreshing employee data');
    setLoadingMessage("Refreshing data...");
    
    // If we have cached data, trigger a database sync
    if (cachedEmployees && cachedEmployees.length > 0) {
      triggerSync().then(() => {
        setTimeout(() => {
          refetchAll();
          setLoadingMessage(null);
          toast({
            title: "Refresh requested",
            description: "Employee data sync has been started"
          });
        }, 1000);
      });
    } else {
      // Otherwise use direct API refresh
      refetch().then(() => {
        toast({
          title: "Refresh complete",
          description: "Employee data has been refreshed",
        });
        setLoadingMessage(null);
      }).catch((error) => {
        console.error("Error refreshing data:", error);
        toast({
          title: "Refresh failed",
          description: error?.message || "Failed to refresh employee data",
          variant: "destructive",
        });
        setLoadingMessage(null);
      });
    }
  };

  // Check if using cached data
  const usingCachedData = cachedEmployees && cachedEmployees.length > 0;
  
  // Check if we're actually using mock data despite having BambooHR configured
  const usingMockDataDespiteConfig = isConfigured && (!usingCachedData) && (!data?.employees || data.employees.length === 0);
  
  // Check if we received partial data due to errors
  // Use optional chaining to safely access the partialData property
  const hasPartialData = data && 'partialData' in data ? data.partialData === true : false;
  
  console.log('Rendering Employees page with filtered employees count:', filteredEmployees.length);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={isLoading || isCacheLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading || isCacheLoading ? "animate-spin" : ""}`} />
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
      
      {usingCachedData && syncStatus && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Stethoscope className="h-5 w-5 mr-2" />
            <div>
              <p className="text-sm font-medium">
                Using cached BambooHR data
              </p>
              <p className="text-sm">
                {syncStatus.last_sync ? (
                  `Last synced ${new Date(syncStatus.last_sync).toLocaleString()}`
                ) : (
                  "Data has never been synced"
                )}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="bg-blue-100">
            <Link to="/admin-settings" className="text-blue-800 flex items-center">
              <RefreshCw className="h-4 w-4 mr-1" />
              Manage Sync
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
                BambooHR is configured, but no data was returned.
              </p>
              <p className="text-sm mt-1">
                This could be due to connection issues, incorrect API credentials, or empty data in your BambooHR account.
              </p>
              <div className="mt-3 flex gap-2">
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
                {data && 'error' in data ? data.error : "Some API endpoints may be unavailable or timed out."}
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
      
      {isLoading && isCacheLoading ? (
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

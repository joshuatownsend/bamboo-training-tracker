import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, RefreshCw, AlertTriangle, Wrench } from "lucide-react";
import EmployeeTable from "@/components/employees/EmployeeTable";
import { useState, useEffect } from "react";
import useBambooHR from "@/hooks/useBambooHR";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Employee, Training, TrainingCompletion } from "@/lib/types";

// Import mock data for fallback only when absolutely necessary
import { employees as mockEmployees, trainings as mockTrainings, trainingCompletions as mockCompletions } from "@/lib/data";

const Employees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  
  // Get data from BambooHR
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
  
  // Only use mock data when BambooHR is NOT configured OR when there's an error
  // Otherwise, always try to use the real data, even if it's empty
  const employeesData: Employee[] = (!isConfigured || error) ? mockEmployees : (data?.employees || []);
  const trainingsData: Training[] = (!isConfigured || error) ? mockTrainings : (data?.trainings || []);
  const completionsData: TrainingCompletion[] = (!isConfigured || error) ? mockCompletions : (data?.completions || []);
  
  // Get unique divisions for filter
  const divisions = [...new Set(employeesData?.map(e => e.division).filter(Boolean))];
  
  // Filter employees based on search and division
  const filteredEmployees = employeesData?.filter(employee => {
    const matchesSearch = employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          employee?.position?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDivision = departmentFilter === "all" || employee?.division === departmentFilter;
    
    return matchesSearch && matchesDivision;
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
              <div className="mt-3 flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/bamboo-troubleshooting" className="text-amber-800">
                    Run Connection Tests
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="bg-amber-100">
                  <Link to="/bamboo-test" className="text-amber-800">
                    <Wrench className="h-4 w-4 mr-1" />
                    Advanced Diagnostics
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
                  <Link to="/bamboo-test" className="text-red-800">
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


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/contexts/UserContext";
import { Search, RefreshCw, AlertCircle, Stethoscope } from "lucide-react";
import useBambooHR from "@/hooks/useBambooHR";
import { UserTrainingsTable } from "@/components/training/UserTrainingsTable";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { UserTraining } from "@/lib/types";

// Helper function to safely get string values
const safeString = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    if (value && 'name' in value) return String(value.name);
    if (value && 'title' in value) return String(value.title);
    if (value && 'id' in value) return String(value.id);
    try {
      return JSON.stringify(value);
    } catch (e) {
      return "[Object]";
    }
  }
  return String(value);
};

export default function MyTrainings() {
  const { currentUser, isAdmin, refreshEmployeeId } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();
  
  const {
    useUserTrainings,
  } = useBambooHR();
  
  const employeeId = currentUser?.employeeId;
  
  // Add logging to debug the employee ID
  useEffect(() => {
    console.log("Current user:", currentUser);
    console.log("Employee ID being used for training fetch:", employeeId);
  }, [currentUser, employeeId]);
  
  const {
    data: userTrainings = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useUserTrainings(employeeId);
  
  // Add logging to see what data we're getting back
  useEffect(() => {
    console.log("User trainings fetched:", userTrainings);
    if (error) {
      console.error("Error fetching user trainings:", error);
    }
  }, [userTrainings, error]);
  
  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      // Try to refresh the employee ID mapping first
      const newEmployeeId = await refreshEmployeeId();
      if (newEmployeeId && newEmployeeId !== employeeId) {
        toast({
          title: "Employee ID Updated",
          description: "Your employee ID mapping has been updated. Refreshing data...",
        });
      }
      
      // Then refetch the trainings
      await refetch();
      toast({
        title: "Refreshed Training Data",
        description: "Your training records have been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Error Refreshing Data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Get unique categories for filter
  const categories = [
    ...new Set(
      userTrainings
        .map((t) => safeString(t.trainingDetails?.category))
        .filter(Boolean)
    ),
  ];
  
  // Apply filters
  const filteredTrainings = userTrainings.filter((training) => {
    const title = safeString(training.trainingDetails?.title).toLowerCase();
    const description = safeString(training.trainingDetails?.description).toLowerCase();
    const notes = safeString(training.notes).toLowerCase();
    
    const matchesSearch = 
      title.includes(searchQuery.toLowerCase()) ||
      description.includes(searchQuery.toLowerCase()) ||
      notes.includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || 
      safeString(training.trainingDetails?.category) === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Calculate statistics
  const totalTrainings = userTrainings.length;
  const categoryCounts = userTrainings.reduce((acc, training) => {
    const category = safeString(training.trainingDetails?.category || 'Uncategorized');
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Find the top category
  let topCategory = 'None';
  let topCount = 0;
  
  // Fix TypeScript errors by properly typing the object entries
  Object.entries(categoryCounts).forEach(([category, count]) => {
    // Use type assertion to tell TypeScript that count is definitely a number
    const countAsNumber = count as number;
    if (countAsNumber > topCount) {
      topCount = countAsNumber;
      topCategory = category;
    }
  });

  // Check if employee ID is missing
  const isMissingEmployeeId = !employeeId || employeeId === currentUser?.id;
  
  // Check if there was an API error
  const hasApiError = error !== null && error !== undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Trainings</h1>
          <p className="text-muted-foreground">
            View your completed training records from BambooHR
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={isLoading || isRefetching}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isMissingEmployeeId && (
        <Alert variant="destructive" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Employee ID Not Found</AlertTitle>
          <AlertDescription>
            Your email address is not mapped to a BambooHR employee ID. 
            {isAdmin ? (
              <span> Please set up the mapping in the <Link to="/admin-settings" className="font-medium underline">Admin Settings</Link> under Employee Mappings.</span>
            ) : (
              <span> Please contact an administrator to set up this mapping for you.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {hasApiError && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Training Data</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error instanceof Error ? error.message : String(error)}</p>
            <div className="flex gap-2 mt-2">
              <Button asChild size="sm" variant="outline" className="bg-red-100">
                <Link to="/bamboo-diagnostics" className="text-red-800">
                  <Stethoscope className="h-4 w-4 mr-1" />
                  Diagnose API Issues
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Trainings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrainings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Training Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeString(topCategory)}</div>
            {topCount > 0 && <div className="text-xs text-muted-foreground">{topCount} trainings</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(categoryCounts).length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search trainings..."
            className="w-full pl-8 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {safeString(category) || 'Uncategorized'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Records</CardTitle>
          <CardDescription>
            These are your completed training records from BambooHR
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mb-4"></div>
              <p className="text-muted-foreground">Loading training records...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500">Error loading training records</p>
              <p className="text-sm text-muted-foreground mt-2">{error instanceof Error ? error.message : String(error)}</p>
              <Button asChild variant="outline" className="gap-2 mt-4">
                <Link to="/bamboo-diagnostics">
                  <Stethoscope className="h-4 w-4" />
                  Diagnose API Issues
                </Link>
              </Button>
            </div>
          ) : (
            <UserTrainingsTable trainings={filteredTrainings} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

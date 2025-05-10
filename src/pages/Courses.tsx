
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import TrainingTable from "@/components/training/TrainingTable";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Training } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import useBambooHR from "@/hooks/useBambooHR";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { isConfigured } = useBambooHR();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch trainings from BambooHR using the correct endpoint
  const { data: bambooData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['bamboohr', 'trainings'],
    queryFn: async () => {
      console.log("Fetching training data from BambooHR...");
      const bamboo = new (await import('@/lib/bamboohr/api')).default({
        subdomain: 'avfrd',
        apiKey: '',
        useEdgeFunction: true,
        edgeFunctionUrl: import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
      });
      
      try {
        // Use the correct endpoint - /training/type
        console.log("Making API call to /training/type endpoint");
        const result = await bamboo.fetchAllTrainings();
        console.log("Fetched training data:", result ? `${result.length} items` : "No data");
        return result;
      } catch (err) {
        console.error("Error fetching training data:", err);
        toast({
          title: "Error fetching training data",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive"
        });
        throw err;
      }
    },
    enabled: isConfigured
  });
  
  // Use the trainings from BambooHR or fall back to empty array if not available
  const trainings = (bambooData && Array.isArray(bambooData)) ? bambooData : [];
    
  const categories = trainings.length > 0 
    ? [...new Set(trainings.map(t => t.category).filter(Boolean))]
    : [];
  
  // Filter trainings based on search and category
  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = searchQuery === "" || 
      training.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (training.description && training.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || training.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['bamboohr', 'trainings'] });
      await refetch();
      toast({
        title: "Refreshed Training Data",
        description: "Training data has been refreshed from BambooHR.",
      });
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh training data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Training Courses</h1>
        <Button 
          onClick={handleRefresh} 
          variant="outline"
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to fetch training data: {error instanceof Error ? error.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-[180px]" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses..."
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
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {trainings.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Training Data</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  No training courses were found in BambooHR. The API call was made to:
                </p>
                <code className="block bg-muted p-2 rounded text-xs">
                  https://api.bamboohr.com/api/gateway.php/avfrd/v1/training/type
                </code>
                <p>
                  Try clicking the Refresh button to update the data from BambooHR.
                  If this issue persists, check your API credentials and network connectivity.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <TrainingTable trainings={filteredTrainings} />
          )}
        </>
      )}
    </div>
  );
};

export default Courses;


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AlertCircle, PlusCircle, Search } from "lucide-react";
import TrainingTable from "@/components/training/TrainingTable";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Training } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import useBambooHR from "@/hooks/useBambooHR";

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { isConfigured } = useBambooHR();
  
  // Fetch trainings from BambooHR
  const { data: bambooData, isLoading, isError, error } = useQuery({
    queryKey: ['bamboohr', 'trainings'],
    queryFn: async () => {
      const bamboo = new (await import('@/lib/bamboohr/api')).default({
        subdomain: 'avfrd',
        apiKey: '',
        useEdgeFunction: true
      });
      return bamboo.fetchAllTrainings();
    },
    enabled: isConfigured
  });
  
  // Use the trainings from BambooHR or fall back to mock data if not available
  const trainings = (bambooData && Array.isArray(bambooData)) ? bambooData : [];
  
  // Get unique types and categories for filtering
  const types = trainings.length > 0 
    ? [...new Set(trainings.map(t => t.type))]
    : [];
  const categories = trainings.length > 0 
    ? [...new Set(trainings.map(t => t.category))]
    : [];
  
  // Filter trainings based on search, type, and category
  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = searchQuery === "" || 
      training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (training.description && training.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "all" || training.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || training.category === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Training Courses</h1>
        {/* Button removed as per request */}
      </div>
      
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to fetch training data: {error?.message || "Unknown error"}
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-[180px]" />
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>
          
          {trainings.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Training Data</AlertTitle>
              <AlertDescription>
                No training courses were found in BambooHR. This could be because the custom report for trainings 
                hasn't been set up in your BambooHR account, or it's not accessible through the API.
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

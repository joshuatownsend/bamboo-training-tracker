
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CachedEmployee, CachedTraining, CachedCompletion } from "@/types/bamboo";

interface CachedDataSummaryProps {
  employees: CachedEmployee[];
  trainings: CachedTraining[];
  completions: CachedCompletion[];
  isEmployeesLoading: boolean;
  isTrainingsLoading: boolean;
  isCompletionsLoading: boolean;
  showDataDetails: boolean;
  setShowDataDetails: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CachedDataSummary: React.FC<CachedDataSummaryProps> = ({ 
  employees, 
  trainings, 
  completions,
  isEmployeesLoading,
  isTrainingsLoading,
  isCompletionsLoading,
  showDataDetails,
  setShowDataDetails
}) => {
  const isLoading = isEmployeesLoading || isTrainingsLoading || isCompletionsLoading;
  
  const hasData = employees.length > 0 || trainings.length > 0 || completions.length > 0;
  
  const toggleDetails = () => setShowDataDetails(!showDataDetails);
  
  if (isLoading) {
    return (
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }
  
  if (!hasData) {
    return (
      <div className="mt-4 py-3 px-4 bg-gray-50 rounded-md text-sm">
        <p className="text-muted-foreground">
          No cached data available. Run a sync to fetch data from BambooHR.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Cached Data</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleDetails}
          className="h-7 w-7 p-0"
        >
          {showDataDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="bg-gray-50 p-2 rounded text-center">
          <div className="font-medium">{employees.length}</div>
          <div className="text-xs text-muted-foreground">Employees</div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded text-center">
          <div className="font-medium">{trainings.length}</div>
          <div className="text-xs text-muted-foreground">Trainings</div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded text-center">
          <div className="font-medium">{completions.length}</div>
          <div className="text-xs text-muted-foreground">Completions</div>
        </div>
      </div>
      
      {showDataDetails && (
        <div className="text-xs space-y-1 mt-2">
          <div className="bg-gray-50 p-2 rounded flex justify-between">
            <span>Most recent employee:</span>
            <span className="font-mono">
              {employees.length > 0 
                ? employees[0].display_name || employees[0].name || `ID: ${employees[0].id}`
                : "None"}
            </span>
          </div>
          
          <div className="bg-gray-50 p-2 rounded flex justify-between">
            <span>Most recent training:</span>
            <span className="font-mono">
              {trainings.length > 0 
                ? trainings[0].title || trainings[0].name || `ID: ${trainings[0].id}`
                : "None"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};


import React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CachedEmployee, CachedTraining, CachedCompletion } from "../../../types/bamboo";

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
  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Cached Data:</p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowDataDetails(!showDataDetails)}
        >
          {showDataDetails ? "Hide Details" : "Show Details"}
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
          {isEmployeesLoading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : (
            <span className="text-xl font-bold">{employees.length}</span>
          )}
          <span className="text-xs text-muted-foreground">Employees</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
          {isTrainingsLoading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : (
            <span className="text-xl font-bold">{trainings.length}</span>
          )}
          <span className="text-xs text-muted-foreground">Trainings</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
          {isCompletionsLoading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : (
            <span className="text-xl font-bold">{completions.length}</span>
          )}
          <span className="text-xs text-muted-foreground">Completions</span>
        </div>
      </div>
      
      {showDataDetails && !isEmployeesLoading && !isTrainingsLoading && !isCompletionsLoading && (
        <div className="mt-2 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Employees by department:</span>
            <span className="font-mono">{new Set(employees.map(e => e.department)).size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Training categories:</span>
            <span className="font-mono">{new Set(trainings.map(t => t.category)).size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recent completions:</span>
            <span className="font-mono">
              {completions.filter(c => {
                const date = c.completionDate ? new Date(c.completionDate) : null;
                if (!date) return false;
                const now = new Date();
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(now.getMonth() - 1);
                return date >= oneMonthAgo;
              }).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

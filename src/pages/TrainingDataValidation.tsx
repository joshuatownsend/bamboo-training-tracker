
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useBambooHR from "@/hooks/useBambooHR";
import { ValidationStatsDisplay } from "@/components/training/validation/ValidationStats";
import { ValidationTable } from "@/components/training/validation/ValidationTable";
import { useValidationData } from "@/components/training/validation/useValidationData";

const TrainingDataValidation = () => {
  const { useAllData } = useBambooHR();
  const { data, isLoading, error } = useAllData();
  
  const { validationStats, sortedIssues, sortField, sortDirection, handleSort } = useValidationData(
    data?.employees, 
    data?.trainings, 
    data?.completions
  );
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <h3 className="text-lg font-medium">Error loading validation data</h3>
        <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Training Data Validation</h1>
      
      <ValidationStatsDisplay stats={validationStats} />
      
      <Card>
        <CardHeader>
          <CardTitle>Date Validation Issues</CardTitle>
          <CardDescription>
            Training completion dates that are either before January 1, 1990 or in the future
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ValidationTable 
            issues={sortedIssues}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingDataValidation;

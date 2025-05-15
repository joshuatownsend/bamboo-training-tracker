
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchPositions } from "@/services/positionService";
import { useTrainings } from "@/hooks/training/useTrainings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PositionSelector } from "@/components/reports/PositionSelector";
import { PositionDetails } from "@/components/reports/PositionDetails";
import { EmptyPositionState } from "@/components/reports/EmptyPositionState";

export default function RequirementsReport() {
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"county" | "avfrd" | "combined">("county");

  // Fetch positions from Supabase
  const { 
    data: positions = [], 
    isLoading: isLoadingPositions,
    error: positionsError
  } = useQuery({
    queryKey: ['positions'],
    queryFn: fetchPositions
  });

  // Fetch trainings from BambooHR
  const {
    trainings,
    isLoadingTrainings,
    isError: isTrainingsError,
    error: trainingsError
  } = useTrainings();

  // Get position details
  const position = positions.find(p => p.id === selectedPosition);
  
  // Get required trainings by type with combined view
  const requiredTrainings = useMemo(() => {
    if (!position) return { county: [], avfrd: [], combined: [] };
    
    const countyTrainings = trainings.filter(t => {
      // Handle both array and RequirementGroup types
      const countyReqs = position.countyRequirements;
      return Array.isArray(countyReqs) ? countyReqs.includes(t.id) : false;
    });
    
    const avfrdTrainings = trainings.filter(t => {
      // Handle both array and RequirementGroup types
      const avfrdReqs = position.avfrdRequirements;
      return Array.isArray(avfrdReqs) ? avfrdReqs.includes(t.id) : false;
    });
    
    // For combined view, merge both sets and remove duplicates
    const combinedMap = new Map();
    
    // Add county trainings to map
    countyTrainings.forEach(training => {
      combinedMap.set(training.id, {
        ...training,
        source: "county"
      });
    });
    
    // Add AVFRD trainings to map (will overwrite duplicates)
    avfrdTrainings.forEach(training => {
      if (combinedMap.has(training.id)) {
        // If already exists, update the source to indicate both
        combinedMap.set(training.id, {
          ...training,
          source: "both"
        });
      } else {
        combinedMap.set(training.id, {
          ...training,
          source: "avfrd"
        });
      }
    });
    
    // Convert map back to array
    const combinedTrainings = Array.from(combinedMap.values());
    
    return { 
      county: countyTrainings, 
      avfrd: avfrdTrainings,
      combined: combinedTrainings
    };
  }, [position, trainings]);

  const isLoading = isLoadingPositions || isLoadingTrainings;
  const error = positionsError || trainingsError;
  const isError = !!error || isTrainingsError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Training Requirements Report</h1>
        <p className="text-muted-foreground">
          View training requirements by position
        </p>
      </div>
      
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading data</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Could not load required data"}
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Position Requirements</CardTitle>
          <CardDescription>
            View training requirements for each position
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full sm:w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <PositionSelector 
                selectedPosition={selectedPosition}
                setSelectedPosition={setSelectedPosition}
                positions={positions}
                isLoading={isLoadingPositions}
              />
              
              {selectedPosition && position ? (
                <PositionDetails
                  position={position}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  requiredTrainings={requiredTrainings}
                />
              ) : (
                <EmptyPositionState />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

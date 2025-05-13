
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useQualifications } from "@/hooks/useQualifications";
import { useUser } from "@/contexts/user";
import { MissingEmployeeIdAlert } from "@/components/training/alerts/MissingEmployeeIdAlert";
import { PositionSelector } from "@/components/required-trainings/PositionSelector";
import { RequiredTrainingDetails } from "@/components/required-trainings/RequiredTrainingDetails";
import { LoadingState } from "@/components/required-trainings/LoadingState";
import { EmptyState } from "@/components/required-trainings/EmptyState";
import { QualificationStatus } from "@/lib/types";

export default function RequiredTrainings() {
  const { currentUser } = useUser();
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  
  const { 
    qualifications, 
    isLoading,
    error 
  } = useQualifications();
  
  // Get the next positions to qualify for (not yet qualified for AVFRD)
  const nextPositions = qualifications.filter(q => !q.isQualifiedAVFRD);
  
  // Get selected position details
  const selectedQualification = selectedPosition
    ? qualifications.find(q => q.positionId === selectedPosition)
    : null;

  // Handle missing employee ID
  if (!currentUser?.employeeId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Advancement</h1>
          <p className="text-muted-foreground">
            View trainings required to qualify for additional positions
          </p>
        </div>
        <MissingEmployeeIdAlert isAdmin={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Advancement</h1>
          <p className="text-muted-foreground">
            View trainings required to qualify for additional positions
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading qualifications</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Unable to load your qualification data. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Advancement</h1>
        <p className="text-muted-foreground">
          View trainings required to qualify for additional positions
        </p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Next Steps for Qualification</CardTitle>
            <CardDescription>
              Select a position to see which trainings you need to complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PositionSelector 
              nextPositions={nextPositions} 
              selectedPosition={selectedPosition} 
              setSelectedPosition={setSelectedPosition} 
            />

            {selectedQualification ? (
              <RequiredTrainingDetails selectedQualification={selectedQualification} />
            ) : (
              <EmptyState hasNextPositions={nextPositions.length > 0} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

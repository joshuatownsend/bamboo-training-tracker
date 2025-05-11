
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePositionManagement } from "@/hooks/usePositionManagement";
import { PositionList } from "@/components/positions/PositionList";
import { PositionForm } from "@/components/positions/PositionForm";
import { useToast } from "@/hooks/use-toast";

export default function PositionManagement() {
  const { toast } = useToast();
  const {
    editingPosition,
    positionsList,
    dialogOpen,
    selectedTrainings,
    trainings,
    isLoading,
    isError,
    error,
    handleSavePosition,
    handleNewPosition,
    handleEditPosition,
    handleDeletePosition,
    handlePositionChange,
    toggleTraining,
    setDialogOpen
  } = usePositionManagement();

  // Show toast message if no trainings are selected in Training Requirements
  React.useEffect(() => {
    if (!isLoading && trainings.length === 0) {
      toast({
        title: "No trainings selected",
        description: "Please select trainings in the Training Requirements page first.",
        variant: "destructive"
      });
    }
  }, [isLoading, trainings.length, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Position Management</h1>
          <p className="text-muted-foreground">
            Define and manage position requirements for AVFRD
          </p>
        </div>
        <Button onClick={handleNewPosition}>
          <Plus className="mr-1 h-4 w-4" />
          Add Position
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading data</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Could not load position data"}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && trainings.length === 0 && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">No trainings selected</AlertTitle>
          <AlertDescription className="text-amber-700">
            Please go to the Training Requirements page to select trainings before defining positions.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Position Requirements</CardTitle>
          <CardDescription>
            Manage qualification requirements for all operational positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <PositionList
              positions={positionsList}
              trainings={trainings}
              onEdit={handleEditPosition}
              onDelete={handleDeletePosition}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <PositionForm
          editingPosition={editingPosition}
          selectedTrainings={selectedTrainings}
          trainings={trainings}
          isLoading={isLoading}
          onPositionChange={handlePositionChange}
          onToggleTraining={toggleTraining}
          onSave={handleSavePosition}
          onCancel={() => setDialogOpen(false)}
        />
      </Dialog>
    </div>
  );
}

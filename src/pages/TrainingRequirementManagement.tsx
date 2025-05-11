
import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/contexts/UserContext";
import { useTrainings } from "@/hooks/training/useTrainings";
import { useTrainingRequirements } from "@/hooks/training/useTrainingRequirements";
import { useTrainingTableState } from "@/hooks/training/useTrainingTableState";
import { useTrainingDialog } from "@/hooks/training/useTrainingDialog";
import { TrainingRequirementHeader } from "@/components/training-requirements/TrainingRequirementHeader";
import { SearchBar } from "@/components/training-requirements/SearchBar";
import { TrainingTable } from "@/components/training-requirements/TrainingTable";
import { TrainingDialog } from "@/components/training-requirements/TrainingDialog";
import { ErrorAlert } from "@/components/training-requirements/ErrorAlert";
import { useToast } from "@/hooks/use-toast";

export default function TrainingRequirementManagement() {
  const { isAdmin } = useUser();
  const { toast } = useToast();
  
  const {
    trainings,
    isLoadingTrainings,
    isError,
    error
  } = useTrainings();

  const {
    selectedTrainings: selectedTrainingsFromHook,
    setSelectedTrainings: setSelectedTrainingsFromHook,
    saveSelections: saveTrainingSelections,
    loading: loadingSelectedTrainings
  } = useTrainingRequirements();

  const {
    searchQuery,
    setSearchQuery,
    selectedTrainings,
    setSelectedTrainings,
    selectedCategories,
    categories,
    filteredTrainings,
    toggleTrainingSelection,
    toggleCategorySelection
  } = useTrainingTableState(trainings);

  const {
    isDialogOpen,
    setIsDialogOpen,
    editingTraining,
    handleEditTraining,
    handleCreateTraining,
    handleSaveTraining,
    updateTrainingField
  } = useTrainingDialog();

  // Sync selected trainings from hook to local state
  useEffect(() => {
    if (!loadingSelectedTrainings) {
      setSelectedTrainings(selectedTrainingsFromHook);
    }
  }, [selectedTrainingsFromHook, loadingSelectedTrainings, setSelectedTrainings]);

  // Handle saving selections
  const handleSaveSelections = () => {
    saveTrainingSelections(selectedTrainings)
      .then(() => {
        toast({
          title: "Selections saved",
          description: `Your training selections have been saved successfully.`
        });
      })
      .catch((error) => {
        console.error("Error saving selections:", error);
        toast({
          title: "Error",
          description: "Failed to save training selections.",
          variant: "destructive"
        });
      });
  };

  // Access control
  if (!isAdmin) {
    return (
      <div className="text-center p-6">
        <h3 className="text-lg font-medium">Access Denied</h3>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TrainingRequirementHeader 
        onSaveSelections={handleSaveSelections}
        onCreateTraining={handleCreateTraining}
      />

      {isError && <ErrorAlert error={error} />}

      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <Card>
        <CardHeader>
          <CardTitle>Training Requirements</CardTitle>
          <CardDescription>
            Select trainings to be used for position qualifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrainingTable
            categories={categories}
            filteredTrainings={filteredTrainings}
            selectedTrainings={selectedTrainings}
            selectedCategories={selectedCategories}
            toggleTrainingSelection={toggleTrainingSelection}
            toggleCategorySelection={toggleCategorySelection}
            handleEditTraining={handleEditTraining}
            isLoadingTrainings={isLoadingTrainings}
          />
        </CardContent>
      </Card>

      <TrainingDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingTraining={editingTraining}
        updateTrainingField={updateTrainingField}
        onSaveTraining={handleSaveTraining}
      />
    </div>
  );
}

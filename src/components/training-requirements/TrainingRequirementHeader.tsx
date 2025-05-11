
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TrainingRequirementHeaderProps {
  onSaveSelections: () => void;
  onCreateTraining: () => void;
}

export function TrainingRequirementHeader({
  onSaveSelections,
  onCreateTraining
}: TrainingRequirementHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Training Requirements Management</h1>
        <p className="text-muted-foreground">
          Manage and select trainings relevant for position qualification
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onSaveSelections} className="gap-2">
          Save Selections
        </Button>
        <Button onClick={onCreateTraining} variant="outline" className="gap-2">
          <Plus className="h-4 w-4" /> Add Training
        </Button>
      </div>
    </div>
  );
}

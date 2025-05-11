
import React from "react";
import { Button } from "@/components/ui/button";

interface TrainingRequirementHeaderProps {
  onSaveSelections: () => void;
}

export function TrainingRequirementHeader({
  onSaveSelections
}: TrainingRequirementHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Training Requirements Management</h1>
        <p className="text-muted-foreground">
          Manage and select trainings relevant for position qualification
        </p>
      </div>
      <div>
        <Button onClick={onSaveSelections} className="gap-2">
          Save Selections
        </Button>
      </div>
    </div>
  );
}

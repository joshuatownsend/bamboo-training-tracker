
import React from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Position, Training } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface PositionFormProps {
  editingPosition: Position | null;
  selectedTrainings: {
    county: string[];
    avfrd: string[];
  };
  trainings: Training[];
  isLoading: boolean;
  onPositionChange: (field: string, value: string) => void;
  onToggleTraining: (id: string, type: "county" | "avfrd") => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PositionForm({
  editingPosition,
  selectedTrainings,
  trainings,
  isLoading,
  onPositionChange,
  onToggleTraining,
  onSave,
  onCancel
}: PositionFormProps) {
  
  const isCreating = editingPosition?.id.startsWith("new-");
  const hasTrainings = trainings.length > 0;

  return (
    <DialogContent className="sm:max-w-[700px]">
      <DialogHeader>
        <DialogTitle>
          {isCreating ? "Create" : "Edit"} Position
        </DialogTitle>
        <DialogDescription>
          Define the requirements for this position for both County and AVFRD.
        </DialogDescription>
      </DialogHeader>
      
      {!hasTrainings && !isLoading && (
        <Alert className="bg-amber-50 border-amber-200 mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            No trainings are currently selected in Training Requirements.
            Position requirements cannot be defined until trainings are selected.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium" htmlFor="title">
              Position Title
            </label>
            <Input
              id="title"
              value={editingPosition?.title || ""}
              onChange={(e) => onPositionChange("title", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="department">
              Department
            </label>
            <Input
              id="department"
              value={editingPosition?.department || ""}
              onChange={(e) => onPositionChange("department", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium" htmlFor="description">
            Description
          </label>
          <Input
            id="description"
            value={editingPosition?.description || ""}
            onChange={(e) => onPositionChange("description", e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
            <h4 className="text-sm font-medium mb-2">County Requirements</h4>
            <div className="border rounded-md p-2 h-60 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : !hasTrainings ? (
                <div className="text-center p-4 text-muted-foreground">
                  No trainings available - please select trainings in Training Requirements
                </div>
              ) : (
                trainings.map((training) => (
                  <div
                    key={training.id}
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                  >
                    <input
                      type="checkbox"
                      id={`county-${training.id}`}
                      checked={selectedTrainings.county.includes(training.id)}
                      onChange={() => onToggleTraining(training.id, "county")}
                    />
                    <label
                      htmlFor={`county-${training.id}`}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      {training.title}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">AVFRD Requirements</h4>
            <div className="border rounded-md p-2 h-60 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : !hasTrainings ? (
                <div className="text-center p-4 text-muted-foreground">
                  No trainings available - please select trainings in Training Requirements
                </div>
              ) : (
                trainings.map((training) => (
                  <div
                    key={training.id}
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                  >
                    <input
                      type="checkbox"
                      id={`avfrd-${training.id}`}
                      checked={selectedTrainings.avfrd.includes(training.id)}
                      onChange={() => onToggleTraining(training.id, "avfrd")}
                    />
                    <label
                      htmlFor={`avfrd-${training.id}`}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      {training.title}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          onClick={onSave} 
          disabled={!editingPosition?.title || !hasTrainings}
        >
          <Save className="mr-1 h-4 w-4" />
          Save Position
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

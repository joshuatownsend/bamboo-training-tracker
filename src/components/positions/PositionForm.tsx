
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
import { Save, ListPlus, ToggleLeft, ToggleRight } from "lucide-react";
import { Position, Training, RequirementGroup } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequirementGroup as RequirementGroupComponent } from "./RequirementGroup";

interface PositionFormProps {
  editingPosition: Position | null;
  selectedTrainings: {
    county: string[];
    avfrd: string[];
  };
  requirementsStructure: {
    county: {
      isComplex: boolean;
      structure: RequirementGroup | null;
    },
    avfrd: {
      isComplex: boolean;
      structure: RequirementGroup | null;
    }
  };
  trainings: Training[];
  isLoading: boolean;
  onPositionChange: (field: string, value: string) => void;
  onToggleTraining: (id: string, type: "county" | "avfrd") => void;
  toggleComplexMode: (type: "county" | "avfrd") => void;
  addRequirementGroup: (type: "county" | "avfrd", parentPath: number[], logic: "AND" | "OR" | "X_OF_Y", count?: number) => void;
  addTrainingToGroup: (type: "county" | "avfrd", trainingId: string, groupPath: number[]) => void;
  removeRequirement: (type: "county" | "avfrd", path: number[]) => void;
  updateXofYCount: (type: "county" | "avfrd", path: number[], count: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PositionForm({
  editingPosition,
  selectedTrainings,
  requirementsStructure,
  trainings,
  isLoading,
  onPositionChange,
  onToggleTraining,
  toggleComplexMode,
  addRequirementGroup,
  addTrainingToGroup,
  removeRequirement,
  updateXofYCount,
  onSave,
  onCancel
}: PositionFormProps) {
  
  const isCreating = editingPosition?.id.startsWith("new-");
  const hasTrainings = trainings.length > 0;
  
  // Simple mode training selection component
  const SimpleTrainingSelector = ({ type }: { type: "county" | "avfrd" }) => (
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
              id={`${type}-${training.id}`}
              checked={selectedTrainings[type].includes(training.id)}
              onChange={() => onToggleTraining(training.id, type)}
            />
            <label
              htmlFor={`${type}-${training.id}`}
              className="flex-1 text-sm cursor-pointer"
            >
              {training.title}
            </label>
          </div>
        ))
      )}
    </div>
  );
  
  // Complex mode requirement builder component
  const ComplexRequirementBuilder = ({ type }: { type: "county" | "avfrd" }) => {
    const structure = requirementsStructure[type];
    
    if (!structure.isComplex || !structure.structure) {
      return (
        <div className="flex flex-col items-center justify-center p-4 border rounded-md">
          <p className="text-muted-foreground mb-2">No complex requirements defined</p>
          <Button 
            onClick={() => addRequirementGroup(type, [], 'AND')} 
            variant="outline"
          >
            <ListPlus className="mr-1 h-4 w-4" />
            Add Requirement Group
          </Button>
        </div>
      );
    }
    
    return (
      <div className="border rounded-md p-2 overflow-y-auto" style={{ maxHeight: '400px' }}>
        <RequirementGroupComponent
          group={structure.structure}
          trainings={trainings}
          groupPath={[]}
          type={type}
          addRequirementGroup={addRequirementGroup}
          addTrainingToGroup={addTrainingToGroup}
          removeRequirement={removeRequirement}
          updateXofYCount={updateXofYCount}
        />
      </div>
    );
  };

  return (
    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
        
        <Tabs defaultValue="county" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="county">County Requirements</TabsTrigger>
            <TabsTrigger value="avfrd">AVFRD Requirements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="county">
            <div className="mt-2 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">County Requirements</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleComplexMode("county")}
                >
                  {requirementsStructure.county.isComplex ? (
                    <>
                      <ToggleLeft className="mr-1 h-4 w-4" />
                      Simple Mode
                    </>
                  ) : (
                    <>
                      <ToggleRight className="mr-1 h-4 w-4" />
                      Advanced Mode
                    </>
                  )}
                </Button>
              </div>
              
              {requirementsStructure.county.isComplex ? (
                <ComplexRequirementBuilder type="county" />
              ) : (
                <SimpleTrainingSelector type="county" />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="avfrd">
            <div className="mt-2 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">AVFRD Requirements</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleComplexMode("avfrd")}
                >
                  {requirementsStructure.avfrd.isComplex ? (
                    <>
                      <ToggleLeft className="mr-1 h-4 w-4" />
                      Simple Mode
                    </>
                  ) : (
                    <>
                      <ToggleRight className="mr-1 h-4 w-4" />
                      Advanced Mode
                    </>
                  )}
                </Button>
              </div>
              
              {requirementsStructure.avfrd.isComplex ? (
                <ComplexRequirementBuilder type="avfrd" />
              ) : (
                <SimpleTrainingSelector type="avfrd" />
              )}
            </div>
          </TabsContent>
        </Tabs>
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

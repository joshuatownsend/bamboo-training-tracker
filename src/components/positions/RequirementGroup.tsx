
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  ListPlus,
  ToggleLeft,
  ToggleRight,
  Check
} from "lucide-react";
import { Training } from "@/lib/types";
import { type RequirementGroup as RequirementGroupType } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface RequirementGroupProps {
  group: RequirementGroupType;
  trainings: Training[];
  groupPath: number[];
  type: "county" | "avfrd";
  addRequirementGroup: (type: "county" | "avfrd", parentPath: number[], logic: "AND" | "OR" | "X_OF_Y", count?: number) => void;
  addTrainingToGroup: (type: "county" | "avfrd", trainingId: string, groupPath: number[]) => void;
  removeRequirement: (type: "county" | "avfrd", path: number[]) => void;
  updateXofYCount: (type: "county" | "avfrd", path: number[], count: number) => void;
}

export function RequirementGroup({
  group,
  trainings,
  groupPath,
  type,
  addRequirementGroup,
  addTrainingToGroup,
  removeRequirement,
  updateXofYCount
}: RequirementGroupProps) {
  const logicLabel = {
    'AND': 'Must complete ALL of:',
    'OR': 'Must complete ANY ONE of:',
    'X_OF_Y': `Must complete ${group.count || 0} of the following:`
  };

  return (
    <div className="border rounded-md p-3 space-y-2 my-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={group.logic === 'AND' ? 'default' : group.logic === 'OR' ? 'secondary' : 'outline'} 
                 className="font-bold">
            {group.logic}
          </Badge>
          <span className="text-sm font-medium">{logicLabel[group.logic]}</span>
          
          {group.logic === 'X_OF_Y' && (
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                className="w-16 h-8 text-center"
                value={group.count || 2}
                min={1}
                max={group.requirements.length || 1}
                onChange={(e) => updateXofYCount(type, groupPath, parseInt(e.target.value) || 1)}
              />
              <span className="text-sm">of {group.requirements.length}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Select onValueChange={(value) => {
            // Remove this group and add a new one with the selected logic
            removeRequirement(type, groupPath);
            addRequirementGroup(type, groupPath.slice(0, -1), value as "AND" | "OR" | "X_OF_Y", group.count);
          }}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Change Logic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
              <SelectItem value="X_OF_Y">X of Y</SelectItem>
            </SelectContent>
          </Select>
          
          <Button size="sm" variant="outline" onClick={() => removeRequirement(type, groupPath)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="pl-4 border-l-2 border-muted space-y-2">
        {/* List of requirements in this group */}
        {group.requirements.map((requirement, index) => {
          const currentPath = [...groupPath, index];
          
          // If requirement is a string (training ID)
          if (typeof requirement === 'string') {
            const training = trainings.find(t => t.id === requirement);
            return (
              <div key={`${requirement}-${index}`} className="flex items-center gap-2">
                <Badge variant="secondary" className="flex-shrink-0">
                  Training
                </Badge>
                <span className="text-sm">
                  {training ? training.title : requirement}
                </span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 ml-auto"
                        onClick={() => removeRequirement(type, currentPath)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          } 
          // If requirement is a nested group
          else {
            return (
              <RequirementGroup
                key={`group-${index}`}
                group={requirement}
                trainings={trainings}
                groupPath={currentPath}
                type={type}
                addRequirementGroup={addRequirementGroup}
                addTrainingToGroup={addTrainingToGroup}
                removeRequirement={removeRequirement}
                updateXofYCount={updateXofYCount}
              />
            );
          }
        })}
        
        {/* Add requirement buttons */}
        <div className="flex gap-2 mt-2">
          <Select onValueChange={(trainingId) => addTrainingToGroup(type, trainingId, groupPath)}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Add Training" />
            </SelectTrigger>
            <SelectContent>
              {trainings.map((training) => (
                <SelectItem key={training.id} value={training.id}>
                  {training.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button size="sm" variant="outline" onClick={() => 
            addRequirementGroup(type, [...groupPath, group.requirements.length], "AND")
          }>
            <ListPlus className="h-4 w-4 mr-1" />
            Add Group
          </Button>
        </div>
      </div>
    </div>
  );
}

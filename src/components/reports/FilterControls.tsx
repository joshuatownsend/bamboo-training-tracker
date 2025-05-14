
import React from "react";
import { Input } from "@/components/ui/input";
import { PositionSelector } from "./PositionSelector";
import { Position } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface FilterControlsProps {
  selectedPosition: string;
  setSelectedPosition: (value: string) => void;
  positions: Position[];
  isLoadingPositions: boolean;
  requirementType: "county" | "avfrd" | "both";
  setRequirementType: (value: "county" | "avfrd" | "both") => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

export function FilterControls({
  selectedPosition,
  setSelectedPosition,
  positions,
  isLoadingPositions,
  requirementType,
  setRequirementType,
  searchQuery,
  setSearchQuery
}: FilterControlsProps) {
  return (
    <div className="space-y-4">
      <div>
        <PositionSelector
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
          positions={positions}
          isLoading={isLoadingPositions}
        />
      </div>
      
      {selectedPosition && (
        <>
          <div className="pt-2">
            <Label className="mb-2 block">Qualification Standard</Label>
            <RadioGroup
              value={requirementType}
              onValueChange={(value) => setRequirementType(value as "county" | "avfrd" | "both")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="county" id="county" />
                <Label htmlFor="county">Loudoun County</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="avfrd" id="avfrd" />
                <Label htmlFor="avfrd">AVFRD</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both">Both</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="pt-2">
            <Label htmlFor="search" className="mb-2 block">Search Volunteers</Label>
            <Input
              id="search"
              placeholder="Search by name, title, or division..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
        </>
      )}
    </div>
  );
}

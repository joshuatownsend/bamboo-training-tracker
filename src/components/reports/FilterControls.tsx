
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Position } from "@/lib/types";
import { PositionSelector } from "./PositionSelector";

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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-full sm:w-1/2">
          <PositionSelector 
            selectedPosition={selectedPosition}
            setSelectedPosition={setSelectedPosition}
            positions={positions}
            isLoading={isLoadingPositions}
          />
        </div>
        
        <div className="w-full sm:w-1/2">
          <Select value={requirementType} onValueChange={(value: "county" | "avfrd" | "both") => setRequirementType(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select requirement type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="county">Loudoun County Requirements</SelectItem>
              <SelectItem value="avfrd">AVFRD Requirements</SelectItem>
              <SelectItem value="both">Both AVFRD and LCCFRS Requirements</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

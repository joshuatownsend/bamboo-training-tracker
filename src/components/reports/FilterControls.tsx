
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Position } from "@/lib/types";

interface FilterControlsProps {
  selectedPosition: string;
  setSelectedPosition: (value: string) => void;
  positions: Position[];
  isLoadingPositions: boolean;
  requirementType: "county" | "avfrd";
  setRequirementType: (value: "county" | "avfrd") => void;
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
          {isLoadingPositions ? (
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          ) : (
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map(position => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="w-full sm:w-1/2">
          <Select value={requirementType} onValueChange={(value: "county" | "avfrd") => setRequirementType(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select requirement type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="county">Loudoun County Requirements</SelectItem>
              <SelectItem value="avfrd">AVFRD Requirements</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {selectedPosition && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search volunteers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

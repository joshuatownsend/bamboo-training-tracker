
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Position } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface PositionSelectorProps {
  selectedPosition: string;
  setSelectedPosition: (value: string) => void;
  positions: Position[];
  isLoading: boolean;
}

export function PositionSelector({ 
  selectedPosition, 
  setSelectedPosition, 
  positions, 
  isLoading 
}: PositionSelectorProps) {
  if (isLoading) {
    return <Skeleton className="h-10 w-full sm:w-1/2" />;
  }

  return (
    <Select value={selectedPosition} onValueChange={setSelectedPosition}>
      <SelectTrigger className="w-full sm:w-1/2">
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
  );
}

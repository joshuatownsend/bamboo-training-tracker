
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QualificationStatus } from "@/lib/types";

interface PositionSelectorProps {
  nextPositions: QualificationStatus[];
  selectedPosition: string;
  setSelectedPosition: (position: string) => void;
}

export function PositionSelector({ 
  nextPositions, 
  selectedPosition, 
  setSelectedPosition 
}: PositionSelectorProps) {
  return (
    <Select value={selectedPosition} onValueChange={setSelectedPosition}>
      <SelectTrigger>
        <SelectValue placeholder="Select a position" />
      </SelectTrigger>
      <SelectContent>
        {nextPositions.map((qualification) => (
          <SelectItem key={qualification.position_id} value={qualification.position_id}>
            {qualification.position_title}
          </SelectItem>
        ))}
        {nextPositions.length === 0 && (
          <SelectItem value="none" disabled>No positions available</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}

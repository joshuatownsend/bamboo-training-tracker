
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash } from "lucide-react";
import { Position, Training } from "@/lib/types";

interface PositionListProps {
  positions: Position[];
  trainings: Training[];
  onEdit: (position: Position) => void;
  onDelete: (id: string) => void;
}

export function PositionList({ 
  positions, 
  trainings, 
  onEdit, 
  onDelete 
}: PositionListProps) {
  // Get training names from IDs
  const getTrainingNames = (ids: string[]) => {
    return ids.map((id) => {
      const training = trainings.find((t) => t.id === id);
      return training?.title || "Unknown";
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">Position</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>County Requirements</TableHead>
          <TableHead>AVFRD Requirements</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((position) => (
          <TableRow key={position.id}>
            <TableCell>
              <div>
                <div className="font-medium">{position.title}</div>
                <div className="text-xs text-muted-foreground">
                  {position.description}
                </div>
              </div>
            </TableCell>
            <TableCell>{position.department}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {getTrainingNames(position.countyRequirements).map((name, idx) => (
                  <Badge key={idx} variant="outline">
                    {name}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {getTrainingNames(position.avfrdRequirements).map((name, idx) => (
                  <Badge key={idx} variant="outline">
                    {name}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(position)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-500 hover:text-red-600"
                onClick={() => onDelete(position.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

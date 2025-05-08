
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { positions, trainings } from "@/lib/data";
import { Position } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, Save, Trash } from "lucide-react";

export default function PositionManagement() {
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionsList, setPositionsList] = useState<Position[]>(positions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTrainings, setSelectedTrainings] = useState<{
    county: string[];
    avfrd: string[];
  }>({ county: [], avfrd: [] });

  // Handle creating or editing a position
  const handleSavePosition = () => {
    if (!editingPosition) return;

    const updatedPosition: Position = {
      ...editingPosition,
      countyRequirements: selectedTrainings.county,
      avfrdRequirements: selectedTrainings.avfrd
    };

    if (editingPosition.id.startsWith("new-")) {
      // Create new with a proper ID
      const newPosition = {
        ...updatedPosition,
        id: `pos-${positionsList.length + 1}`
      };
      setPositionsList([...positionsList, newPosition]);
    } else {
      // Update existing
      setPositionsList(
        positionsList.map((p) => (p.id === updatedPosition.id ? updatedPosition : p))
      );
    }

    setDialogOpen(false);
    setEditingPosition(null);
  };

  // Handle creating a new position
  const handleNewPosition = () => {
    const newPosition: Position = {
      id: `new-${Date.now()}`,
      title: "",
      description: "",
      department: "",
      countyRequirements: [],
      avfrdRequirements: []
    };
    setEditingPosition(newPosition);
    setSelectedTrainings({ county: [], avfrd: [] });
    setDialogOpen(true);
  };

  // Handle editing an existing position
  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setSelectedTrainings({
      county: [...position.countyRequirements],
      avfrd: [...position.avfrdRequirements]
    });
    setDialogOpen(true);
  };

  // Handle deleting a position
  const handleDeletePosition = (id: string) => {
    setPositionsList(positionsList.filter((p) => p.id !== id));
  };

  // Get training names from IDs
  const getTrainingNames = (ids: string[]) => {
    return ids.map((id) => trainings.find((t) => t.id === id)?.title || "Unknown");
  };

  // Toggle a training in the selected list
  const toggleTraining = (id: string, type: "county" | "avfrd") => {
    setSelectedTrainings((prev) => {
      const currentList = prev[type];
      const newList = currentList.includes(id)
        ? currentList.filter((t) => t !== id)
        : [...currentList, id];
      return { ...prev, [type]: newList };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Position Management</h1>
          <p className="text-muted-foreground">
            Define and manage position requirements for AVFRD
          </p>
        </div>
        <Button onClick={handleNewPosition}>
          <Plus className="mr-1 h-4 w-4" />
          Add Position
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Position Requirements</CardTitle>
          <CardDescription>
            Manage qualification requirements for all operational positions
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {positionsList.map((position) => (
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
                      onClick={() => handleEditPosition(position)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeletePosition(position.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingPosition?.id.startsWith("new-") ? "Create" : "Edit"} Position
            </DialogTitle>
            <DialogDescription>
              Define the requirements for this position for both County and AVFRD.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" htmlFor="title">
                  Position Title
                </label>
                <Input
                  id="title"
                  value={editingPosition?.title || ""}
                  onChange={(e) =>
                    setEditingPosition({
                      ...editingPosition!,
                      title: e.target.value
                    })
                  }
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
                  onChange={(e) =>
                    setEditingPosition({
                      ...editingPosition!,
                      department: e.target.value
                    })
                  }
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
                onChange={(e) =>
                  setEditingPosition({
                    ...editingPosition!,
                    description: e.target.value
                  })
                }
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <h4 className="text-sm font-medium mb-2">County Requirements</h4>
                <div className="border rounded-md p-2 h-60 overflow-y-auto">
                  {trainings.map((training) => (
                    <div
                      key={training.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                    >
                      <input
                        type="checkbox"
                        id={`county-${training.id}`}
                        checked={selectedTrainings.county.includes(training.id)}
                        onChange={() => toggleTraining(training.id, "county")}
                      />
                      <label
                        htmlFor={`county-${training.id}`}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        {training.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">AVFRD Requirements</h4>
                <div className="border rounded-md p-2 h-60 overflow-y-auto">
                  {trainings.map((training) => (
                    <div
                      key={training.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                    >
                      <input
                        type="checkbox"
                        id={`avfrd-${training.id}`}
                        checked={selectedTrainings.avfrd.includes(training.id)}
                        onChange={() => toggleTraining(training.id, "avfrd")}
                      />
                      <label
                        htmlFor={`avfrd-${training.id}`}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        {training.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePosition} disabled={!editingPosition?.title}>
              <Save className="mr-1 h-4 w-4" />
              Save Position
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { positions } from "@/lib/data";
import { Position, Training } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, Save, Trash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import useBambooHR from "@/hooks/useBambooHR";
import { useToast } from "@/hooks/use-toast";

export default function PositionManagement() {
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionsList, setPositionsList] = useState<Position[]>(positions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTrainings, setSelectedTrainings] = useState<{
    county: string[];
    avfrd: string[];
  }>({ county: [], avfrd: [] });

  const { isConfigured } = useBambooHR();
  const { toast } = useToast();

  // Fetch trainings from BambooHR
  const { data: trainings = [], isLoading, isError, error } = useQuery({
    queryKey: ['bamboohr', 'trainings'],
    queryFn: async () => {
      console.log("Fetching training data from BambooHR for Position Management...");
      const bamboo = new (await import('@/lib/bamboohr/api')).default({
        subdomain: 'avfrd',
        apiKey: '',
        useEdgeFunction: true,
        edgeFunctionUrl: import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
      });
      
      try {
        const result = await bamboo.fetchAllTrainings();
        console.log("Fetched training data for Position Management:", result ? `${result.length} items` : "No data");
        return result || [];
      } catch (err) {
        console.error("Error fetching training data:", err);
        toast({
          title: "Error fetching training data",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive"
        });
        throw err;
      }
    },
    enabled: isConfigured
  });

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
    return ids.map((id) => {
      const training = trainings.find((t) => t.id === id);
      return training?.title || "Unknown";
    });
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

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading training data</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Could not load training data from BambooHR"}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Position Requirements</CardTitle>
          <CardDescription>
            Manage qualification requirements for all operational positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
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
          )}
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
                  {isLoading ? (
                    <div className="space-y-2 p-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : trainings.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      No trainings available from BambooHR
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
                          onChange={() => toggleTraining(training.id, "county")}
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
                  ) : trainings.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      No trainings available from BambooHR
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
                          onChange={() => toggleTraining(training.id, "avfrd")}
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

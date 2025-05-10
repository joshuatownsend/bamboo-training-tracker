
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { Plus, Edit, Trash } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { trainings } from "@/lib/data";
import { Training } from "@/lib/types";

export default function TrainingRequirementManagement() {
  const { isAdmin } = useUser();
  const [trainingData, setTrainingData] = useState<Training[]>(trainings);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);

  if (!isAdmin) {
    return (
      <div className="text-center p-6">
        <h3 className="text-lg font-medium">Access Denied</h3>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleEditTraining = (training: Training) => {
    setEditingTraining({ ...training });
    setIsDialogOpen(true);
  };

  const handleCreateTraining = () => {
    setEditingTraining({
      id: `training-${Date.now()}`,
      title: "",
      description: "",
      category: "",
      durationHours: 0,
      type: "",
      requiredFor: [],
      expiryYears: 0
    });
    setIsDialogOpen(true);
  };

  const handleSaveTraining = () => {
    if (!editingTraining) return;

    if (trainingData.find(t => t.id === editingTraining.id)) {
      setTrainingData(trainingData.map(t => 
        t.id === editingTraining.id ? editingTraining : t
      ));
    } else {
      setTrainingData([...trainingData, editingTraining]);
    }
    
    setIsDialogOpen(false);
  };

  const handleDeleteTraining = (id: string) => {
    setTrainingData(trainingData.filter(t => t.id !== id));
  };

  const updateTrainingField = (field: string, value: string | number) => {
    setEditingTraining({
      ...editingTraining!,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Requirements Management</h1>
          <p className="text-muted-foreground">
            Manage training definitions and requirements
          </p>
        </div>
        <Button onClick={handleCreateTraining}>
          <Plus className="mr-2 h-4 w-4" /> Add Training
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Definitions</CardTitle>
          <CardDescription>
            Edit training requirements and certification details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration (hours)</TableHead>
                <TableHead>Expiry (years)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainingData.map((training) => (
                <TableRow key={training.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{training.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {training.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{training.category}</TableCell>
                  <TableCell>{training.durationHours}</TableCell>
                  <TableCell>{training.expiryYears || "No expiry"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditTraining(training)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteTraining(training.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingTraining && editingTraining.id.includes("training-") ? "Create Training" : "Edit Training"}
            </DialogTitle>
            <DialogDescription>
              Define the details for this training or certification.
            </DialogDescription>
          </DialogHeader>
          {editingTraining && (
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="title">Training Name</Label>
                <Input
                  id="title"
                  value={editingTraining.title}
                  onChange={(e) => updateTrainingField("title", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editingTraining.description}
                  onChange={(e) => updateTrainingField("description", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={editingTraining.category}
                    onChange={(e) => updateTrainingField("category", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="durationHours">Duration (hours)</Label>
                  <Input
                    id="durationHours"
                    type="number"
                    value={editingTraining.durationHours}
                    onChange={(e) => updateTrainingField("durationHours", Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="expiryYears">Expiry Period (years, 0 for no expiry)</Label>
                <Input
                  id="expiryYears"
                  type="number"
                  value={editingTraining.expiryYears || 0}
                  onChange={(e) => updateTrainingField("expiryYears", Number(e.target.value))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTraining}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

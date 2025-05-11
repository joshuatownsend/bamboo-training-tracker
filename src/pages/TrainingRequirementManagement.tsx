
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { Plus, Edit, Trash, RefreshCw, Search } from "lucide-react";
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
import { Training } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { TableCategoryHeader } from "@/components/training/TableCategoryHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrainings } from "@/hooks/training/useTrainings";
import { useTrainingRequirements } from "@/hooks/training/useTrainingRequirements";

export default function TrainingRequirementManagement() {
  const { isAdmin } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [selectedTrainings, setSelectedTrainings] = useState<Record<string, boolean>>({});
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({});
  
  const {
    trainings,
    isLoadingTrainings,
    isError,
    error
  } = useTrainings();

  const {
    selectedTrainings: selectedTrainingsFromHook,
    setSelectedTrainings: setSelectedTrainingsFromHook,
    saveSelections: saveTrainingSelections,
    getSelectedTrainings,
    loading: loadingSelectedTrainings
  } = useTrainingRequirements();

  // Group trainings by category
  const groupedTrainings = trainings.reduce((acc, training) => {
    const category = training.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(training);
    return acc;
  }, {} as Record<string, Training[]>);

  // Get all categories
  const categories = Object.keys(groupedTrainings).sort();

  // Filter trainings based on search query
  const filteredTrainings = Object.entries(groupedTrainings).reduce((acc, [category, trainings]) => {
    const filtered = trainings.filter(training => 
      !searchQuery || 
      training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (training.description && training.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, Training[]>);

  // Access control
  if (!isAdmin) {
    return (
      <div className="text-center p-6">
        <h3 className="text-lg font-medium">Access Denied</h3>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  // Handle toggling a training selection
  const toggleTrainingSelection = (id: string) => {
    setSelectedTrainings(prev => ({
      ...prev,
      [id]: !prev[id]
    }));

    // Update category selection state based on all trainings in that category
    const trainingCategory = trainings.find(t => t.id === id)?.category || 'Uncategorized';
    const categoryTrainings = groupedTrainings[trainingCategory];
    const updatedSelection = {
      ...selectedTrainings,
      [id]: !selectedTrainings[id]
    };
    
    const allSelected = categoryTrainings.every(t => 
      t.id === id ? updatedSelection[t.id] : selectedTrainings[t.id]
    );
    
    setSelectedCategories(prev => ({
      ...prev,
      [trainingCategory]: allSelected
    }));
  };

  // Handle toggling a whole category
  const toggleCategorySelection = (category: string) => {
    const isSelected = !selectedCategories[category];
    setSelectedCategories(prev => ({
      ...prev,
      [category]: isSelected
    }));

    // Update all trainings in this category
    const categoryTrainings = groupedTrainings[category];
    if (categoryTrainings) {
      const updatedTrainings = { ...selectedTrainings };
      categoryTrainings.forEach(training => {
        updatedTrainings[training.id] = isSelected;
      });
      setSelectedTrainings(updatedTrainings);
    }
  };

  // Handle saving selections
  const handleSaveSelections = () => {
    saveTrainingSelections(selectedTrainings)
      .then(() => {
        toast({
          title: "Selections saved",
          description: `Your training selections have been saved successfully.`
        });
      })
      .catch((error) => {
        console.error("Error saving selections:", error);
        toast({
          title: "Error",
          description: "Failed to save training selections.",
          variant: "destructive"
        });
      });
  };

  // Handle editing training
  const handleEditTraining = (training: Training) => {
    setEditingTraining({ ...training });
    setIsDialogOpen(true);
  };

  // Handle creating new training
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

  // Handle saving training
  const handleSaveTraining = () => {
    if (!editingTraining) return;

    // In a real app, you would update the database here
    
    setIsDialogOpen(false);
    toast({
      title: "Training saved",
      description: `Training "${editingTraining.title}" has been saved.`
    });
  };

  // Update training field
  const updateTrainingField = (field: string, value: string | number) => {
    if (!editingTraining) return;
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
            Manage and select trainings relevant for position qualification
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveSelections} className="gap-2">
            Save Selections
          </Button>
          <Button onClick={handleCreateTraining} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add Training
          </Button>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to fetch training data: {error instanceof Error ? error.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search trainings..."
            className="w-full pl-8 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Requirements</CardTitle>
          <CardDescription>
            Select trainings to be used for position qualifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTrainings ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Select</TableHead>
                    <TableHead className="w-[300px]">Training Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No trainings found. Try refreshing or adding new trainings.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => {
                      const categoryTrainings = filteredTrainings[category] || [];
                      if (categoryTrainings.length === 0) return null;
                      
                      return (
                        <React.Fragment key={`category-${category}`}>
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell>
                              <Checkbox 
                                checked={selectedCategories[category] || false}
                                onCheckedChange={() => toggleCategorySelection(category)}
                              />
                            </TableCell>
                            <TableCell colSpan={3} className="font-medium py-2">
                              {category}
                            </TableCell>
                          </TableRow>
                          {categoryTrainings.map((training) => (
                            <TableRow key={training.id}>
                              <TableCell>
                                <Checkbox 
                                  checked={selectedTrainings[training.id] || false}
                                  onCheckedChange={() => toggleTrainingSelection(training.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{training.title}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {training.description || "No description available"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{training.category || "Uncategorized"}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditTraining(training)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
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


import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { trainings, positions } from "@/lib/data";
import { Training } from "@/lib/types";
import { Edit, Filter, Plus, Save, Trash } from "lucide-react";

export default function TrainingRequirementManagement() {
  const [filteredTrainings, setFilteredTrainings] = useState<Training[]>(trainings);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requirementUsage, setRequirementUsage] = useState<Record<string, string[]>>({});

  // Get unique categories and types for filters
  const categories = Array.from(new Set(trainings.map(t => t.category)));
  const types = Array.from(new Set(trainings.map(t => t.type)));

  // Calculate which positions use each training
  useEffect(() => {
    const usage: Record<string, string[]> = {};
    
    trainings.forEach(training => {
      usage[training.id] = [];
      
      positions.forEach(position => {
        if (
          position.countyRequirements.includes(training.id) ||
          position.avfrdRequirements.includes(training.id)
        ) {
          usage[training.id].push(position.title);
        }
      });
    });
    
    setRequirementUsage(usage);
  }, []);

  // Filter trainings based on search term and selected filters
  useEffect(() => {
    let result = trainings;
    
    if (searchTerm) {
      result = result.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter.length > 0) {
      result = result.filter(t => categoryFilter.includes(t.category));
    }
    
    if (typeFilter.length > 0) {
      result = result.filter(t => typeFilter.includes(t.type));
    }
    
    setFilteredTrainings(result);
  }, [searchTerm, categoryFilter, typeFilter]);

  // Handle toggling category filter
  const toggleCategoryFilter = (category: string) => {
    setCategoryFilter(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle toggling type filter
  const toggleTypeFilter = (type: string) => {
    setTypeFilter(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Handle editing a training requirement
  const handleEditTraining = (training: Training) => {
    setEditingTraining({...training});
    setDialogOpen(true);
  };

  // Handle saving edited training requirement
  const handleSaveTraining = () => {
    // In a real app, you would call an API to update the training
    // For now, we'll just close the dialog
    setDialogOpen(false);
    setEditingTraining(null);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter([]);
    setTypeFilter([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Requirements</h1>
          <p className="text-muted-foreground">
            Manage and filter training requirements for positions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Requirements</CardTitle>
          <CardDescription>
            Filter and manage requirements that are available for positions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search input */}
            <div className="flex-1">
              <Input
                placeholder="Search trainings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Filter dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {(categoryFilter.length > 0 || typeFilter.length > 0) && (
                    <Badge className="ml-2 bg-company-yellow text-company-black">
                      {categoryFilter.length + typeFilter.length}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Filter Requirements</DialogTitle>
                  <DialogDescription>
                    Filter training requirements by category and type
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Categories</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`category-${category}`}
                            checked={categoryFilter.includes(category)}
                            onCheckedChange={() => toggleCategoryFilter(category)}
                          />
                          <label
                            htmlFor={`category-${category}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Types</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {types.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`type-${type}`}
                            checked={typeFilter.includes(type)}
                            onCheckedChange={() => toggleTypeFilter(type)}
                          />
                          <label
                            htmlFor={`type-${type}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button type="submit" onClick={() => {}}>
                    Apply Filters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Training</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Used In Positions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No requirements found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrainings.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{training.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {training.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={training.type === "Certification" ? "default" : "secondary"}>
                          {training.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{training.category}</TableCell>
                      <TableCell>{training.durationHours} hours</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {requirementUsage[training.id]?.length > 0 ? (
                            requirementUsage[training.id].map((position, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {position}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">Not used</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditTraining(training)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit training dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Training Requirement</DialogTitle>
            <DialogDescription>
              Update details for this training requirement
            </DialogDescription>
          </DialogHeader>
          
          {editingTraining && (
            <div className="grid gap-4 py-4">
              <div>
                <label className="text-sm font-medium" htmlFor="title">
                  Title
                </label>
                <Input
                  id="title"
                  value={editingTraining.title}
                  onChange={(e) => setEditingTraining({...editingTraining, title: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium" htmlFor="description">
                  Description
                </label>
                <Input
                  id="description"
                  value={editingTraining.description}
                  onChange={(e) => setEditingTraining({...editingTraining, description: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium" htmlFor="type">
                    Type
                  </label>
                  <Input
                    id="type"
                    value={editingTraining.type}
                    onChange={(e) => setEditingTraining({...editingTraining, type: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="category">
                    Category
                  </label>
                  <Input
                    id="category"
                    value={editingTraining.category}
                    onChange={(e) => setEditingTraining({...editingTraining, category: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium" htmlFor="duration">
                  Duration (hours)
                </label>
                <Input
                  id="duration"
                  type="number"
                  value={editingTraining.durationHours}
                  onChange={(e) => setEditingTraining({...editingTraining, durationHours: parseInt(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTraining}>
              <Save className="mr-1 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

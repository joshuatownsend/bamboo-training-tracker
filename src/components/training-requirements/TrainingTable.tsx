
import React from "react";
import { Training } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TrainingTableProps {
  categories: string[];
  filteredTrainings: Record<string, Training[]>;
  selectedTrainings: Record<string, boolean>;
  selectedCategories: Record<string, boolean>;
  toggleTrainingSelection: (id: string) => void;
  toggleCategorySelection: (category: string) => void;
  handleEditTraining: (training: Training) => void;
  isLoadingTrainings: boolean;
}

export function TrainingTable({
  categories,
  filteredTrainings,
  selectedTrainings,
  selectedCategories,
  toggleTrainingSelection,
  toggleCategorySelection,
  handleEditTraining,
  isLoadingTrainings
}: TrainingTableProps) {
  if (isLoadingTrainings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
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
  );
}

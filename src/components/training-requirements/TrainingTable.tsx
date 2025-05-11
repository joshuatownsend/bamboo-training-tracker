
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from "lucide-react";

interface TrainingTableProps {
  categories: string[];
  filteredTrainings: Record<string, any[]>;
  selectedTrainings: Record<string, boolean>;
  selectedCategories: Record<string, boolean>;
  toggleTrainingSelection: (id: string) => void;
  toggleCategorySelection: (category: string) => void;
  isLoadingTrainings: boolean;
}

export const TrainingTable = ({
  categories,
  filteredTrainings,
  selectedTrainings,
  selectedCategories,
  toggleTrainingSelection,
  toggleCategorySelection,
  isLoadingTrainings,
}: TrainingTableProps) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    categories.reduce((acc, category) => ({ ...acc, [category]: true }), {})
  );

  // Expand all categories
  const handleExpandAll = () => {
    const expanded = categories.reduce(
      (acc, category) => ({ ...acc, [category]: true }),
      {}
    );
    setOpenCategories(expanded);
  };

  // Collapse all categories
  const handleCollapseAll = () => {
    const collapsed = categories.reduce(
      (acc, category) => ({ ...acc, [category]: false }),
      {}
    );
    setOpenCategories(collapsed);
  };

  // Toggle a single category
  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (isLoadingTrainings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // No trainings or filtered trainings
  if (categories.length === 0 || Object.keys(filteredTrainings).length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No trainings match your search criteria
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2">
        <Button
          onClick={handleExpandAll}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <ChevronDown className="h-4 w-4" />
          Expand All
        </Button>
        <Button
          onClick={handleCollapseAll}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <ChevronUp className="h-4 w-4" />
          Collapse All
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60%]">Training</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="w-[120px] text-center">Required</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.keys(filteredTrainings)
            .sort()
            .map((category) => (
              <React.Fragment key={category}>
                <TableRow className="hover:bg-muted/70 cursor-pointer">
                  <TableCell
                    colSpan={2}
                    className="font-medium py-2"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center gap-2">
                      {openCategories[category] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {category} ({filteredTrainings[category].length})
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategorySelection(category);
                      }}
                    >
                      {selectedCategories[category] ? (
                        <ToggleRight className="h-5 w-5 text-company-yellow" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
                
                {openCategories[category] && filteredTrainings[category].map((training) => (
                  <TableRow key={training.id}>
                    <TableCell className="pl-8">
                      {training.title}
                      {training.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {training.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{training.category}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTrainingSelection(training.id)}
                      >
                        {selectedTrainings[training.id] ? (
                          <ToggleRight className="h-5 w-5 text-company-yellow" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

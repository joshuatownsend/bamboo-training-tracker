
import React, { useState, useEffect } from "react";
import { Training } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Collapsible,
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TrainingTableProps {
  categories: string[];
  filteredTrainings: Record<string, Training[]>;
  selectedTrainings: Record<string, boolean>;
  selectedCategories: Record<string, boolean>;
  toggleTrainingSelection: (id: string) => void;
  toggleCategorySelection: (category: string) => void;
  isLoadingTrainings: boolean;
}

export function TrainingTable({
  categories,
  filteredTrainings,
  selectedTrainings,
  selectedCategories,
  toggleTrainingSelection,
  toggleCategorySelection,
  isLoadingTrainings
}: TrainingTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // Auto-expand categories with at least one selected training
  useEffect(() => {
    if (isLoadingTrainings) return;
    
    const newExpandedState = {...expandedCategories};
    
    categories.forEach(category => {
      const categoryTrainings = filteredTrainings[category] || [];
      const hasSelectedTrainings = categoryTrainings.some(training => 
        selectedTrainings[training.id]
      );
      
      // Only auto-expand if there are selected trainings and the category
      // hasn't been explicitly collapsed by the user
      if (hasSelectedTrainings && expandedCategories[category] !== false) {
        newExpandedState[category] = true;
      }
    });
    
    setExpandedCategories(newExpandedState);
  }, [selectedTrainings, categories, filteredTrainings, isLoadingTrainings, expandedCategories]);
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Select</TableHead>
            <TableHead className="w-[400px]">Training Name</TableHead>
            <TableHead>Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                No trainings found. Try refreshing or adding new trainings.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => {
              const categoryTrainings = filteredTrainings[category] || [];
              if (categoryTrainings.length === 0) return null;
              
              const isExpanded = expandedCategories[category] || false;
              
              return (
                <React.Fragment key={`category-${category}`}>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableCell>
                      <Checkbox 
                        checked={selectedCategories[category] || false}
                        onCheckedChange={() => toggleCategorySelection(category)}
                      />
                    </TableCell>
                    <TableCell colSpan={2} className="font-medium py-2">
                      <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                        <div className="flex items-center justify-between">
                          <span>{category}</span>
                          <CollapsibleTrigger asChild>
                            <button className="p-1 rounded-md hover:bg-muted/60 focus:outline-none">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
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
                            </TableRow>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}


import { useState, useEffect } from "react";
import { Training } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function useTrainingTableState(trainings: Training[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrainings, setSelectedTrainings] = useState<Record<string, boolean>>({});
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
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

  return {
    searchQuery,
    setSearchQuery,
    selectedTrainings,
    setSelectedTrainings,
    selectedCategories,
    setSelectedCategories,
    groupedTrainings,
    categories,
    filteredTrainings,
    toggleTrainingSelection,
    toggleCategorySelection
  };
}


import { useState, useMemo } from 'react';
import { UserTraining } from "@/lib/types";
import { safeString } from '@/components/training/utils/StringUtils';

export function useTrainingFilters(userTrainings: UserTraining[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("completion_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Get unique categories for filter
  const categories = useMemo(() => [
    ...new Set(
      userTrainings
        .map((t) => safeString(t.training_details?.category))
        .filter(Boolean)
    ),
  ], [userTrainings]);

  // Calculate statistics
  const categoryCounts = useMemo(() => userTrainings.reduce((acc, training) => {
    const category = safeString(training.training_details?.category || 'Uncategorized');
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>), [userTrainings]);
  
  // Function to handle sorting
  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
  };
  
  // Apply filters
  const filteredTrainings = useMemo(() => userTrainings
    .filter((training) => {
      const title = safeString(training.training_details?.title).toLowerCase();
      const description = safeString(training.training_details?.description).toLowerCase();
      const notes = safeString(training.notes).toLowerCase();
      
      const matchesSearch = 
        title.includes(searchQuery.toLowerCase()) ||
        description.includes(searchQuery.toLowerCase()) ||
        notes.includes(searchQuery.toLowerCase());
      
      // Fix the type issue by ensuring both sides are strings
      const trainingCategory = safeString(training.training_details?.category);
      const matchesCategory = categoryFilter === "all" || trainingCategory === categoryFilter;
      
      return matchesSearch && matchesCategory;
    }), [userTrainings, searchQuery, categoryFilter]);
  
  // Function to sort trainings
  const sortTrainings = (trainings: UserTraining[]): UserTraining[] => {
    return [...trainings].sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      // Extract values to compare based on the sort field
      switch(sortField) {
        case 'title':
          valueA = safeString(a.training_details?.title);
          valueB = safeString(b.training_details?.title);
          break;
        case 'category':
          valueA = safeString(a.training_details?.category);
          valueB = safeString(b.training_details?.category);
          break;
        case 'completion_date':
          valueA = a.completion_date || '';
          valueB = b.completion_date || '';
          break;
        default:
          valueA = a[sortField as keyof UserTraining] || '';
          valueB = b[sortField as keyof UserTraining] || '';
      }
      
      // Handle string comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      // Handle number comparison
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc'
          ? valueA - valueB
          : valueB - valueA;
      }
      
      // Default comparison for mixed types
      return sortDirection === 'asc'
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });
  };
  
  // Apply sorting after filtering
  const sortedTrainings = sortTrainings(filteredTrainings);

  return {
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sortField,
    sortDirection,
    handleSort,
    categories,
    categoryCounts,
    sortedTrainings
  };
}

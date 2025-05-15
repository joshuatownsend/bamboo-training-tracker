
import { useState, useMemo, useCallback } from 'react';
import { UserTraining } from '@/lib/types';
import { safeTextValue } from '@/lib/training-utils';

type SortField = 'title' | 'category' | 'completionDate';
type SortDirection = 'asc' | 'desc';

export function useTrainingFilters(trainings: UserTraining[]) {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('completionDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Extract unique categories
  const categories = useMemo(() => {
    const categoriesSet = new Set<string>();
    trainings.forEach(training => {
      const category = safeTextValue(training.trainingDetails?.category) || 'Uncategorized';
      categoriesSet.add(category);
    });
    // We don't need to add 'all' to the categories list since it's added separately in the UI
    return Array.from(categoriesSet).sort();
  }, [trainings]);
  
  // Calculate category counts
  const categoryCounts = useMemo(() => {
    return trainings.reduce((acc, training) => {
      const category = safeTextValue(training.trainingDetails?.category) || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [trainings]);

  // Custom sort function with improved date handling
  const getSortedTrainings = useCallback((trainings: UserTraining[]): UserTraining[] => {
    // Debug info
    console.log(`Sorting trainings by ${sortField} in ${sortDirection} order`);

    // First apply category filter if not 'all'
    const filteredTrainings = categoryFilter === 'all' 
      ? trainings 
      : trainings.filter(t => {
          const category = safeTextValue(t.trainingDetails?.category) || 'Uncategorized';
          return category === categoryFilter;
        });
    
    // Apply search filter
    const searchFilteredTrainings = searchQuery 
      ? filteredTrainings.filter(training => {
          const title = safeTextValue(training.trainingDetails?.title);
          const desc = safeTextValue(training.trainingDetails?.description);
          const searchLower = searchQuery.toLowerCase();
          return title.toLowerCase().includes(searchLower) || 
                 desc.toLowerCase().includes(searchLower);
        })
      : filteredTrainings;
    
    // FIXED: Improved sorting with better date handling
    return [...searchFilteredTrainings].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'title') {
        const titleA = safeTextValue(a.trainingDetails?.title).toLowerCase();
        const titleB = safeTextValue(b.trainingDetails?.title).toLowerCase();
        comparison = titleA.localeCompare(titleB);
      } 
      else if (sortField === 'category') {
        const catA = safeTextValue(a.trainingDetails?.category || 'Uncategorized').toLowerCase();
        const catB = safeTextValue(b.trainingDetails?.category || 'Uncategorized').toLowerCase();
        comparison = catA.localeCompare(catB);
      } 
      else if (sortField === 'completionDate') {
        // FIXED: Handle missing dates (null, undefined, empty string)
        const dateA = a.completionDate || '';
        const dateB = b.completionDate || '';
        
        // Log the date values to help with debugging
        console.log("Sorting dates:", { dateA, dateB, typeA: typeof dateA, typeB: typeof dateB });
        
        if (!dateA && !dateB) comparison = 0;
        else if (!dateA) comparison = 1; // No date goes last
        else if (!dateB) comparison = -1; // No date goes last
        else {
          // Try to compare as dates first
          try {
            const dateObjA = new Date(dateA);
            const dateObjB = new Date(dateB);
            
            // Check if both dates are valid
            if (!isNaN(dateObjA.getTime()) && !isNaN(dateObjB.getTime())) {
              comparison = dateObjA.getTime() - dateObjB.getTime();
            } else {
              // Fallback to string comparison if date parsing fails
              comparison = String(dateA).localeCompare(String(dateB));
            }
          } catch (e) {
            // If date comparison fails, fallback to string comparison
            comparison = String(dateA).localeCompare(String(dateB));
          }
        }
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [sortField, sortDirection, categoryFilter, searchQuery]);
  
  // Get the sorted and filtered trainings
  const sortedTrainings = useMemo(() => {
    return getSortedTrainings(trainings);
  }, [trainings, getSortedTrainings]);

  // Handle sorting toggle
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking on the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending for date, ascending for others
      setSortField(field);
      setSortDirection(field === 'completionDate' ? 'desc' : 'asc');
    }
  };

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

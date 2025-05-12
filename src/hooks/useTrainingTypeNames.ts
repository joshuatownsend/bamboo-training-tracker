
import { useState, useEffect } from 'react';
import { UserTraining } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTrainingTypeNames(trainings: UserTraining[]) {
  const [trainingTypeNames, setTrainingTypeNames] = useState<Record<string, string>>({});
  
  // Extract unique training types
  const trainingTypeIds = Array.from(
    new Set(
      trainings
        .filter(training => training.training_id)
        .map(training => training.training_id)
    )
  );
  
  // Fetch training type names from the database
  const { data: trainingTypes, isLoading: isLoadingNames } = useQuery({
    queryKey: ['training-types'],
    queryFn: async () => {
      if (trainingTypeIds.length === 0) return [];
      
      // Fetch training types from database
      const { data, error } = await supabase
        .from('bamboo_training_types')
        .select('id, name')
        .in('id', trainingTypeIds);
        
      if (error) {
        console.error('Error fetching training types:', error);
        return [];
      }
      
      return data || [];
    }
  });
  
  // Update training type names when data is fetched
  useEffect(() => {
    if (trainingTypes?.length) {
      const namesMap: Record<string, string> = {};
      
      trainingTypes.forEach(type => {
        if (type.id && type.name) {
          namesMap[type.id] = type.name;
        }
      });
      
      setTrainingTypeNames(namesMap);
    }
  }, [trainingTypes]);
  
  return { trainingTypeNames, isLoadingNames };
}

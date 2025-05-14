
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserTraining, TrainingCompletion } from "@/lib/types";

export function useTrainingTypeNames(trainings: UserTraining[] | TrainingCompletion[]) {
  const [trainingTypeNames, setTrainingTypeNames] = useState<Record<string, string>>({});
  const [isLoadingNames, setIsLoadingNames] = useState(true);

  // Fetch training type names from Supabase
  useEffect(() => {
    const fetchTrainingTypeNames = async () => {
      setIsLoadingNames(true);
      
      try {
        // Extract all unique training IDs and convert to numbers
        const trainingIds = [...new Set(trainings.map(t => {
          // Handle both UserTraining and TrainingCompletion types
          const id = 'trainingId' in t ? t.trainingId : 
                     'type' in t ? t.type : '';
          return id;
        }))]
          .filter(id => id)
          .map(id => {
            const numId = parseInt(id, 10);
            return isNaN(numId) ? 0 : numId;
          })
          .filter(id => id > 0);

        if (trainingIds.length === 0) {
          setIsLoadingNames(false);
          return;
        }

        // Fetch training names from Supabase
        const { data, error } = await supabase
          .from('bamboo_training_types')
          .select('id, name')
          .in('id', trainingIds);

        if (error) {
          console.error('Error fetching training names:', error);
          return;
        }

        // Create a mapping of ID to name
        const nameMap = data.reduce((acc, item) => {
          // Store the key as a string for consistent lookups
          acc[String(item.id)] = item.name;
          return acc;
        }, {} as Record<string, string>);

        setTrainingTypeNames(nameMap);
      } catch (error) {
        console.error('Error in fetchTrainingTypeNames:', error);
      } finally {
        setIsLoadingNames(false);
      }
    };

    fetchTrainingTypeNames();
  }, [trainings]);

  return { trainingTypeNames, isLoadingNames };
}

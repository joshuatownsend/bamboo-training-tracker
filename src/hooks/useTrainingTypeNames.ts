
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserTraining } from "@/lib/types";

export function useTrainingTypeNames(trainings: UserTraining[]) {
  const [trainingTypeNames, setTrainingTypeNames] = useState<Record<string, string>>({});
  const [isLoadingNames, setIsLoadingNames] = useState(true);

  // Fetch training type names from Supabase
  useEffect(() => {
    const fetchTrainingTypeNames = async () => {
      setIsLoadingNames(true);
      
      try {
        // Extract all unique training IDs
        const trainingIds = [...new Set(trainings.map(t => 
          t.trainingId || t.type?.toString() || ''))]
          .filter(id => id);

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
          acc[item.id] = item.name;
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


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee, Training, TrainingCompletion } from "@/lib/types";
import { useTrainingTypeNames } from "@/hooks/useTrainingTypeNames";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CompletionItem from "./CompletionItem";
import EmptyCompletions from "./EmptyCompletions";
import { getTrainingName } from "./utils/training-display-utils";

interface RecentCompletionsProps {
  completions: TrainingCompletion[];
  employees: Employee[];
  trainings: Training[];
}

export function RecentCompletions({ 
  completions,
  employees,
  trainings
}: RecentCompletionsProps) {
  // State for direct database training names
  const [trainingNamesMap, setTrainingNamesMap] = useState<Record<string, string>>({});
  
  // Log data for debugging
  console.log("RecentCompletions component received:", { 
    completionsCount: completions?.length || 0, 
    employeesCount: employees?.length || 0,
    trainingsCount: trainings?.length || 0
  });

  // Use our custom hook to get training names
  const { trainingTypeNames, isLoadingNames } = useTrainingTypeNames(completions);
  
  // Fetch actual training names directly from bamboo_training_types
  useEffect(() => {
    const fetchTrainingNames = async () => {
      // Extract all unique training IDs from completions
      const trainingIds = [...new Set(completions.map(c => c.trainingId))]
        .filter(Boolean)
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id));
      
      if (trainingIds.length === 0) return;
      
      try {
        // IMPROVED: Direct fetch of training names with better logging
        console.log(`Fetching training names for ${trainingIds.length} unique IDs:`, trainingIds);
        
        const { data, error } = await supabase
          .from('bamboo_training_types')
          .select('id, name')
          .in('id', trainingIds);
        
        if (error) {
          console.error('Error fetching training names:', error);
          return;
        }
        
        // Create a mapping of ID to name
        const namesMap = data.reduce((acc, item) => {
          acc[String(item.id)] = item.name;
          return acc;
        }, {} as Record<string, string>);
        
        setTrainingNamesMap(namesMap);
        console.log(`Fetched ${data.length} training names for display`, namesMap);
        
        // ADDED: Log any IDs that couldn't be resolved
        const missingIds = trainingIds.filter(id => !namesMap[id]);
        if (missingIds.length > 0) {
          console.warn(`Could not find names for ${missingIds.length} training IDs:`, missingIds);
        }
      } catch (error) {
        console.error('Error in fetchTrainingNames:', error);
      }
    };
    
    fetchTrainingNames();
  }, [completions]);
  
  if (!completions?.length) {
    console.warn("No completions data provided to RecentCompletions component");
    return <EmptyCompletions title="Recent Completions" />;
  }

  // Get most recent 10 completions
  const recentCompletions = [...completions]
    .sort((a, b) => 
      new Date(b.completionDate || '').getTime() - new Date(a.completionDate || '').getTime()
    )
    .slice(0, 10);
    
  console.log(`Found ${recentCompletions.length} recent completions to display`);
  
  if (!recentCompletions.length) {
    return <EmptyCompletions title="Recent Completions" message="No completed trainings found" />;
  }
    
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Completions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentCompletions.map((completion) => {
            const trainingName = getTrainingName(
              completion,
              trainingNamesMap,
              trainingTypeNames,
              trainings
            );
            
            return (
              <CompletionItem
                key={completion.id}
                completion={completion}
                trainingName={trainingName}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentCompletions;

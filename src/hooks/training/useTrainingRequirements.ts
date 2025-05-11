
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Training } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function useTrainingRequirements() {
  const [selectedTrainings, setSelectedTrainings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load selected trainings from database
  useEffect(() => {
    const loadSelectedTrainings = async () => {
      setLoading(true);
      try {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('training_selections')
          .select('training_id, is_selected');
          
        if (error) {
          throw error;
        }

        // Convert array to record
        const selections: Record<string, boolean> = {};
        if (data) {
          data.forEach((item) => {
            selections[item.training_id] = item.is_selected;
          });
        }

        console.log("Loaded selections from database:", selections);
        setSelectedTrainings(selections);
      } catch (error) {
        console.error("Error loading selected trainings:", error);
        toast({
          title: "Error",
          description: "Failed to load training selections from database",
          variant: "destructive",
        });
        
        // Fallback to localStorage if available
        const savedSelections = localStorage.getItem('training_selections');
        if (savedSelections) {
          setSelectedTrainings(JSON.parse(savedSelections));
          toast({
            title: "Info",
            description: "Loaded selections from local storage as fallback",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadSelectedTrainings();
  }, [toast]);

  // Save selections to database
  const saveSelections = async (selections: Record<string, boolean>) => {
    try {
      // First, store in localStorage as backup
      localStorage.setItem('training_selections', JSON.stringify(selections));
      
      // Create array of upsert objects
      const upsertData = Object.keys(selections).map(id => ({
        training_id: id,
        is_selected: selections[id]
      }));
      
      // Log the data being sent to verify
      console.log("Saving training selections:", upsertData);
      
      // First, delete existing selections to avoid conflicts
      // This ensures a clean state before inserting new selections
      const { error: deleteError } = await supabase
        .from('training_selections')
        .delete()
        .in('training_id', Object.keys(selections));
        
      if (deleteError) {
        console.error("Error deleting existing selections:", deleteError);
        throw deleteError;
      }
      
      // Then insert new selections
      const { error: insertError } = await supabase
        .from('training_selections')
        .insert(upsertData);
      
      if (insertError) {
        console.error("Error inserting selections:", insertError);
        throw insertError;
      }
      
      setSelectedTrainings(selections);
      
      toast({
        title: "Success",
        description: "Training selections saved to database",
      });
      
      return true;
    } catch (error) {
      console.error("Error saving selected trainings:", error);
      toast({
        title: "Error",
        description: "Failed to save training selections to database",
        variant: "destructive",
      });
      return false;
    }
  };

  // Get only selected trainings
  const getSelectedTrainings = (trainings: Training[]) => {
    return trainings.filter(training => selectedTrainings[training.id]);
  };

  return {
    selectedTrainings,
    setSelectedTrainings,
    saveSelections,
    getSelectedTrainings,
    loading
  };
}

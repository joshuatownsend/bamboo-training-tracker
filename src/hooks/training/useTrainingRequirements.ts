
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
        // In a real app, you'd fetch the selected trainings from your database
        // For now, we'll just simulate this with localStorage
        const savedSelections = localStorage.getItem('training_selections');
        if (savedSelections) {
          setSelectedTrainings(JSON.parse(savedSelections));
        }
      } catch (error) {
        console.error("Error loading selected trainings:", error);
        toast({
          title: "Error",
          description: "Failed to load training selections",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSelectedTrainings();
  }, [toast]);

  // Save selections to database
  const saveSelections = async (selections: Record<string, boolean>) => {
    try {
      // In a real app, you'd save to your database
      // For now, just use localStorage
      localStorage.setItem('training_selections', JSON.stringify(selections));
      
      setSelectedTrainings(selections);
      
      toast({
        title: "Success",
        description: "Training selections saved successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error saving selected trainings:", error);
      toast({
        title: "Error",
        description: "Failed to save training selections",
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

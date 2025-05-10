
import { useState, useEffect } from "react";
import { Position, Training } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useBambooHR from "@/hooks/useBambooHR";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function usePositionManagement() {
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTrainings, setSelectedTrainings] = useState<{
    county: string[];
    avfrd: string[];
  }>({ county: [], avfrd: [] });

  const { isConfigured } = useBambooHR();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch positions from Supabase
  const { 
    data: positionsList = [], 
    isLoading: isLoadingPositions,
    error: positionsError
  } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('*');
      
      if (error) {
        console.error("Error fetching positions:", error);
        throw error;
      }
      
      return data.map(position => ({
        ...position,
        countyRequirements: position.county_requirements || [],
        avfrdRequirements: position.avfrd_requirements || []
      })) as Position[];
    }
  });

  // Fetch trainings from BambooHR
  const { data: trainings = [], isLoading: isLoadingTrainings, isError, error } = useQuery({
    queryKey: ['bamboohr', 'trainings'],
    queryFn: async () => {
      console.log("Fetching training data from BambooHR for Position Management...");
      const bamboo = new (await import('@/lib/bamboohr/api')).default({
        subdomain: 'avfrd',
        apiKey: '',
        useEdgeFunction: true,
        edgeFunctionUrl: import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
      });
      
      try {
        const result = await bamboo.fetchAllTrainings();
        console.log("Fetched training data for Position Management:", result ? `${result.length} items` : "No data");
        return result || [];
      } catch (err) {
        console.error("Error fetching training data:", err);
        toast({
          title: "Error fetching training data",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive"
        });
        throw err;
      }
    },
    enabled: isConfigured
  });

  // Add position mutation
  const createPositionMutation = useMutation({
    mutationFn: async (position: Position) => {
      const { data, error } = await supabase
        .from('positions')
        .insert({
          title: position.title,
          description: position.description || null,
          department: position.department || null,
          county_requirements: position.countyRequirements,
          avfrd_requirements: position.avfrdRequirements
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast({
        title: "Position created",
        description: "The position has been successfully created"
      });
    },
    onError: (error) => {
      console.error("Error creating position:", error);
      toast({
        title: "Error creating position",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Update position mutation
  const updatePositionMutation = useMutation({
    mutationFn: async (position: Position) => {
      const { data, error } = await supabase
        .from('positions')
        .update({
          title: position.title,
          description: position.description || null,
          department: position.department || null,
          county_requirements: position.countyRequirements,
          avfrd_requirements: position.avfrdRequirements
        })
        .eq('id', position.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast({
        title: "Position updated",
        description: "The position has been successfully updated"
      });
    },
    onError: (error) => {
      console.error("Error updating position:", error);
      toast({
        title: "Error updating position",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Delete position mutation
  const deletePositionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast({
        title: "Position deleted",
        description: "The position has been successfully deleted"
      });
    },
    onError: (error) => {
      console.error("Error deleting position:", error);
      toast({
        title: "Error deleting position",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Handle creating or editing a position
  const handleSavePosition = () => {
    if (!editingPosition) return;

    const updatedPosition: Position = {
      ...editingPosition,
      countyRequirements: selectedTrainings.county,
      avfrdRequirements: selectedTrainings.avfrd
    };

    if (!updatedPosition.id || updatedPosition.id.startsWith("new-")) {
      // Create new position
      createPositionMutation.mutate(updatedPosition);
    } else {
      // Update existing position
      updatePositionMutation.mutate(updatedPosition);
    }

    setDialogOpen(false);
    setEditingPosition(null);
  };

  // Handle creating a new position
  const handleNewPosition = () => {
    const newPosition: Position = {
      id: `new-${Date.now()}`,
      title: "",
      description: "",
      department: "",
      countyRequirements: [],
      avfrdRequirements: []
    };
    setEditingPosition(newPosition);
    setSelectedTrainings({ county: [], avfrd: [] });
    setDialogOpen(true);
  };

  // Handle editing an existing position
  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setSelectedTrainings({
      county: [...position.countyRequirements],
      avfrd: [...position.avfrdRequirements]
    });
    setDialogOpen(true);
  };

  // Handle deleting a position
  const handleDeletePosition = (id: string) => {
    deletePositionMutation.mutate(id);
  };

  // Update position field
  const handlePositionChange = (field: string, value: string) => {
    if (!editingPosition) return;
    setEditingPosition({
      ...editingPosition,
      [field]: value
    });
  };

  // Toggle a training in the selected list
  const toggleTraining = (id: string, type: "county" | "avfrd") => {
    setSelectedTrainings((prev) => {
      const currentList = prev[type];
      const newList = currentList.includes(id)
        ? currentList.filter((t) => t !== id)
        : [...currentList, id];
      return { ...prev, [type]: newList };
    });
  };

  const isLoading = isLoadingTrainings || isLoadingPositions;

  return {
    editingPosition,
    positionsList,
    dialogOpen,
    selectedTrainings,
    trainings: trainings as Training[],
    isLoading,
    isError: isError || !!positionsError,
    error: error || positionsError,
    handleSavePosition,
    handleNewPosition,
    handleEditPosition,
    handleDeletePosition,
    handlePositionChange,
    toggleTraining,
    setDialogOpen
  };
}

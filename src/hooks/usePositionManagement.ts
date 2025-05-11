
import { useState } from "react";
import { Position } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { fetchPositions } from "@/services/positionService";
import { usePositionMutations } from "@/hooks/mutations/usePositionMutations";
import { useTrainings } from "@/hooks/training/useTrainings";

export function usePositionManagement() {
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTrainings, setSelectedTrainings] = useState<{
    county: string[];
    avfrd: string[];
  }>({ county: [], avfrd: [] });

  const {
    createPositionMutation,
    updatePositionMutation,
    deletePositionMutation
  } = usePositionMutations();

  const {
    trainings,
    isLoadingTrainings,
    isError: isTrainingsError,
    error: trainingsError
  } = useTrainings();

  // Fetch positions from Supabase
  const { 
    data: positionsList = [], 
    isLoading: isLoadingPositions,
    error: positionsError
  } = useQuery({
    queryKey: ['positions'],
    queryFn: fetchPositions
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
  const isError = isTrainingsError || !!positionsError;
  const error = trainingsError || positionsError;

  return {
    editingPosition,
    positionsList,
    dialogOpen,
    selectedTrainings,
    trainings,
    isLoading,
    isError,
    error,
    handleSavePosition,
    handleNewPosition,
    handleEditPosition,
    handleDeletePosition,
    handlePositionChange,
    toggleTraining,
    setDialogOpen
  };
}

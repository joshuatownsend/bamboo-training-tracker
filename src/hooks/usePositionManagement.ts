
import { useState } from "react";
import { Position, Training } from "@/lib/types";
import { positions } from "@/lib/data";
import { useQuery } from "@tanstack/react-query";
import useBambooHR from "@/hooks/useBambooHR";
import { useToast } from "@/hooks/use-toast";

export function usePositionManagement() {
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionsList, setPositionsList] = useState<Position[]>(positions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTrainings, setSelectedTrainings] = useState<{
    county: string[];
    avfrd: string[];
  }>({ county: [], avfrd: [] });

  const { isConfigured } = useBambooHR();
  const { toast } = useToast();

  // Fetch trainings from BambooHR
  const { data: trainings = [], isLoading, isError, error } = useQuery({
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

  // Handle creating or editing a position
  const handleSavePosition = () => {
    if (!editingPosition) return;

    const updatedPosition: Position = {
      ...editingPosition,
      countyRequirements: selectedTrainings.county,
      avfrdRequirements: selectedTrainings.avfrd
    };

    if (editingPosition.id.startsWith("new-")) {
      // Create new with a proper ID
      const newPosition = {
        ...updatedPosition,
        id: `pos-${positionsList.length + 1}`
      };
      setPositionsList([...positionsList, newPosition]);
    } else {
      // Update existing
      setPositionsList(
        positionsList.map((p) => (p.id === updatedPosition.id ? updatedPosition : p))
      );
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
    setPositionsList(positionsList.filter((p) => p.id !== id));
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

  return {
    editingPosition,
    positionsList,
    dialogOpen,
    selectedTrainings,
    trainings: trainings as Training[],
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

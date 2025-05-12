
import { useState } from "react";
import { Training } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function useTrainingDialog() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const { toast } = useToast();

  // Handle editing training
  const handleEditTraining = (training: Training) => {
    setEditingTraining({ ...training });
    setIsDialogOpen(true);
  };

  // Handle creating new training
  const handleCreateTraining = () => {
    setEditingTraining({
      id: `training-${Date.now()}`,
      title: "",
      description: "",
      category: "",
      durationHours: 0,
      type: "",
      requiredFor: [],
      expiryYears: 0
    });
    setIsDialogOpen(true);
  };

  // Handle saving training
  const handleSaveTraining = () => {
    if (!editingTraining) return;

    // In a real app, you would update the database here
    
    setIsDialogOpen(false);
    toast({
      title: "Training saved",
      description: `Training "${editingTraining.title}" has been saved.`
    });
  };

  // Update training field
  const updateTrainingField = (field: string, value: string | number) => {
    if (!editingTraining) return;
    setEditingTraining({
      ...editingTraining!,
      [field]: value
    });
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    editingTraining,
    handleEditTraining,
    handleCreateTraining,
    handleSaveTraining,
    updateTrainingField
  };
}

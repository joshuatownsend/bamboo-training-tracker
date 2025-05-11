
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Position } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { createPosition, updatePosition, deletePosition } from "@/services/positionService";

export function usePositionMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPositionMutation = useMutation({
    mutationFn: createPosition,
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

  const updatePositionMutation = useMutation({
    mutationFn: updatePosition,
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

  const deletePositionMutation = useMutation({
    mutationFn: deletePosition,
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

  return {
    createPositionMutation,
    updatePositionMutation,
    deletePositionMutation
  };
}


import { useState } from "react";
import { Position, RequirementGroup, RequirementLogic } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { fetchPositions } from "@/services/positionService";
import { usePositionMutations } from "@/hooks/mutations/usePositionMutations";
import { useTrainings } from "@/hooks/training/useTrainings";
import { useTrainingRequirements } from "@/hooks/training/useTrainingRequirements";

export function usePositionManagement() {
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Track requirements structure for county and AVFRD
  const [requirementsStructure, setRequirementsStructure] = useState<{
    county: {
      isComplex: boolean;
      structure: RequirementGroup | null;
    },
    avfrd: {
      isComplex: boolean;
      structure: RequirementGroup | null;
    }
  }>({
    county: { isComplex: false, structure: null },
    avfrd: { isComplex: false, structure: null }
  });
  
  // For simple mode, we'll still use the selectedTrainings state
  const [selectedTrainings, setSelectedTrainings] = useState<{
    county: string[];
    avfrd: string[];
  }>({ county: [], avfrd: [] });

  const {
    createPositionMutation,
    updatePositionMutation,
    deletePositionMutation
  } = usePositionMutations();

  // Fetch all trainings
  const {
    trainings: allTrainings,
    isLoadingTrainings,
    isError: isTrainingsError,
    error: trainingsError
  } = useTrainings();

  // Get selected trainings from Training Requirements
  const {
    selectedTrainings: selectedTrainingRequirements,
    loading: loadingSelectedTrainings
  } = useTrainingRequirements();

  // Filter trainings to only include the ones selected in Training Requirements
  const trainings = allTrainings.filter(training => 
    selectedTrainingRequirements[training.id]
  );

  // Fetch positions from Supabase
  const { 
    data: positionsList = [], 
    isLoading: isLoadingPositions,
    error: positionsError
  } = useQuery({
    queryKey: ['positions'],
    queryFn: fetchPositions
  });

  // Toggle between simple and complex requirement modes
  const toggleComplexMode = (type: "county" | "avfrd") => {
    setRequirementsStructure(prev => {
      // When switching to complex mode, convert simple array to AND group
      if (!prev[type].isComplex && editingPosition) {
        const initialStructure: RequirementGroup = {
          logic: 'AND',
          requirements: Array.isArray(type === 'county' 
            ? editingPosition.countyRequirements 
            : editingPosition.avfrdRequirements)
            ? [...(type === 'county' 
                ? editingPosition.countyRequirements as string[] 
                : editingPosition.avfrdRequirements as string[])]
            : []
        };
        
        return {
          ...prev,
          [type]: { 
            isComplex: true, 
            structure: initialStructure 
          }
        };
      }
      // When switching back to simple mode, flatten the structure to array of training IDs
      else {
        return {
          ...prev,
          [type]: { 
            isComplex: false, 
            structure: null 
          }
        };
      }
    });
  };

  // Add a requirement group (AND, OR, X_OF_Y) to the structure
  const addRequirementGroup = (
    type: "county" | "avfrd", 
    parentPath: number[] = [], 
    logic: RequirementLogic = 'AND',
    count: number = 2
  ) => {
    setRequirementsStructure(prev => {
      const structure = { ...prev };
      const newGroup: RequirementGroup = { 
        logic, 
        requirements: [],
        ...(logic === 'X_OF_Y' ? { count } : {})
      };
      
      // If adding at root level
      if (parentPath.length === 0) {
        structure[type].structure = newGroup;
      } 
      // If adding to existing group
      else {
        let currentGroup = structure[type].structure;
        for (let i = 0; i < parentPath.length - 1; i++) {
          if (currentGroup && Array.isArray(currentGroup.requirements)) {
            const requirement = currentGroup.requirements[parentPath[i]];
            if (typeof requirement !== 'string') {
              currentGroup = requirement;
            }
          }
        }
        
        if (currentGroup && Array.isArray(currentGroup.requirements)) {
          const lastIndex = parentPath[parentPath.length - 1];
          currentGroup.requirements.splice(lastIndex, 0, newGroup);
        }
      }
      
      return structure;
    });
  };

  // Add a training to a requirement group
  const addTrainingToGroup = (
    type: "county" | "avfrd", 
    trainingId: string,
    groupPath: number[] = []
  ) => {
    setRequirementsStructure(prev => {
      const structure = { ...prev };
      
      // If adding to root level
      if (groupPath.length === 0) {
        if (structure[type].structure) {
          structure[type].structure?.requirements.push(trainingId);
        }
      } 
      // If adding to nested group
      else {
        let currentGroup = structure[type].structure;
        for (let i = 0; i < groupPath.length; i++) {
          if (currentGroup && Array.isArray(currentGroup.requirements)) {
            const requirement = currentGroup.requirements[groupPath[i]];
            if (i === groupPath.length - 1) {
              // We've reached the target group
              currentGroup.requirements.push(trainingId);
              break;
            } else if (typeof requirement !== 'string') {
              currentGroup = requirement;
            }
          }
        }
      }
      
      return structure;
    });
  };

  // Remove a requirement (training or group) from structure
  const removeRequirement = (
    type: "county" | "avfrd", 
    path: number[]
  ) => {
    setRequirementsStructure(prev => {
      const structure = { ...prev };
      
      // If removing from root level (shouldn't happen, but handle it)
      if (path.length === 1) {
        if (structure[type].structure) {
          structure[type].structure?.requirements.splice(path[0], 1);
        }
      } 
      // If removing from nested group
      else if (path.length > 1) {
        let currentGroup = structure[type].structure;
        for (let i = 0; i < path.length - 1; i++) {
          if (currentGroup && Array.isArray(currentGroup.requirements)) {
            const requirement = currentGroup.requirements[path[i]];
            if (typeof requirement !== 'string') {
              currentGroup = requirement;
            }
          }
        }
        
        if (currentGroup && Array.isArray(currentGroup.requirements)) {
          const lastIndex = path[path.length - 1];
          currentGroup.requirements.splice(lastIndex, 1);
        }
      }
      
      return structure;
    });
  };

  // Update X value in X_OF_Y logic
  const updateXofYCount = (
    type: "county" | "avfrd", 
    path: number[],
    count: number
  ) => {
    setRequirementsStructure(prev => {
      const structure = { ...prev };
      
      let currentGroup = structure[type].structure;
      for (let i = 0; i < path.length; i++) {
        if (currentGroup && Array.isArray(currentGroup.requirements)) {
          const requirement = currentGroup.requirements[path[i]];
          if (i === path.length - 1) {
            // We've reached the target group
            currentGroup.count = count;
            break;
          } else if (typeof requirement !== 'string') {
            currentGroup = requirement;
          }
        }
      }
      
      return structure;
    });
  };

  // Handle creating or editing a position
  const handleSavePosition = () => {
    if (!editingPosition) return;

    const updatedPosition: Position = {
      ...editingPosition,
      countyRequirements: requirementsStructure.county.isComplex 
        ? requirementsStructure.county.structure 
        : selectedTrainings.county,
      avfrdRequirements: requirementsStructure.avfrd.isComplex 
        ? requirementsStructure.avfrd.structure 
        : selectedTrainings.avfrd
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
    // Reset requirement structures
    setRequirementsStructure({
      county: { isComplex: false, structure: null },
      avfrd: { isComplex: false, structure: null }
    });
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
    // Reset requirement structures
    setRequirementsStructure({
      county: { isComplex: false, structure: null },
      avfrd: { isComplex: false, structure: null }
    });
    setDialogOpen(true);
  };

  // Handle editing an existing position
  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    
    // Initialize selected trainings and requirement structures
    const countyReqs = position.countyRequirements;
    const avfrdReqs = position.avfrdRequirements;
    
    // Check if requirements are complex structures or simple arrays
    const countyIsComplex = !Array.isArray(countyReqs);
    const avfrdIsComplex = !Array.isArray(avfrdReqs);
    
    setRequirementsStructure({
      county: { 
        isComplex: countyIsComplex, 
        structure: countyIsComplex ? countyReqs as RequirementGroup : null 
      },
      avfrd: { 
        isComplex: avfrdIsComplex, 
        structure: avfrdIsComplex ? avfrdReqs as RequirementGroup : null 
      }
    });
    
    // Set the selected trainings for simple mode
    setSelectedTrainings({
      county: Array.isArray(countyReqs) ? [...countyReqs] : [],
      avfrd: Array.isArray(avfrdReqs) ? [...avfrdReqs] : []
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

  // Toggle a training in the selected list (for simple mode)
  const toggleTraining = (id: string, type: "county" | "avfrd") => {
    setSelectedTrainings((prev) => {
      const currentList = prev[type];
      const newList = currentList.includes(id)
        ? currentList.filter((t) => t !== id)
        : [...currentList, id];
      return { ...prev, [type]: newList };
    });
  };

  const isLoading = isLoadingTrainings || isLoadingPositions || loadingSelectedTrainings;
  const isError = isTrainingsError || !!positionsError;
  const error = trainingsError || positionsError;

  return {
    editingPosition,
    positionsList,
    dialogOpen,
    selectedTrainings,
    requirementsStructure,
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
    setDialogOpen,
    toggleComplexMode,
    addRequirementGroup,
    addTrainingToGroup,
    removeRequirement,
    updateXofYCount
  };
}

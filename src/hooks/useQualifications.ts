
import { useEffect } from "react";
import { useUser } from "@/contexts/user";
import { QualificationStatus, Training } from "@/lib/types";
import { getAllPositionQualifications } from "@/lib/qualifications";
import { useToast } from "@/components/ui/use-toast";
import { useTrainingData } from "./qualification/useTrainingData";
import { usePositionData } from "./qualification/usePositionData";
import { useQualificationTabs } from "./qualification/useQualificationTabs";

export function useQualifications() {
  const { currentUser, isLoading: isUserLoading } = useUser();
  const { activeTab, setActiveTab } = useQualificationTabs();
  const { toast } = useToast();

  // Get training data from useTrainingData hook with correct property access
  const { 
    userCompletedTrainings, 
    trainingTypes, 
    isLoadingTrainings, 
    isLoadingTrainingTypes, 
    trainingsError 
  } = useTrainingData();

  // Get positions data from usePositionData hook
  const { 
    positions, 
    isLoadingPositions, 
    positionsError 
  } = usePositionData();

  useEffect(() => {
    if (positionsError || trainingsError) {
      toast({
        title: "Error loading qualifications",
        description: "There was a problem loading your qualification data. Please try again later.",
        variant: "destructive"
      });
    }
  }, [positionsError, trainingsError, toast]);

  // Convert TrainingType[] to Training[] by adding the required properties
  const trainingsForQualifications: Training[] = trainingTypes.map(trainingType => ({
    id: trainingType.id,
    title: trainingType.name,
    type: trainingType.category || 'Unknown',
    category: trainingType.category || 'Unknown',
    description: trainingType.description || '',
    durationHours: 0, // Default value since we don't have this data
    requiredFor: [] // Default value since we don't have this data
  }));

  // Calculate qualifications once we have all required data
  const qualifications: QualificationStatus[] = currentUser && !isLoadingPositions && !isLoadingTrainings
    ? getAllPositionQualifications(
        currentUser.employeeId,
        positions,
        trainingsForQualifications,
        userCompletedTrainings
      )
    : [];

  const isLoading = isUserLoading || isLoadingPositions || isLoadingTrainings || isLoadingTrainingTypes;
    
  return {
    qualifications,
    activeTab,
    setActiveTab,
    isLoading,
    error: positionsError || trainingsError
  };
}

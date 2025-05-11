
import { useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { QualificationStatus } from "@/lib/types";
import { getAllPositionQualifications } from "@/lib/qualifications";
import { useToast } from "@/components/ui/use-toast";
import { useTrainingData } from "./qualification/useTrainingData";
import { usePositionData } from "./qualification/usePositionData";
import { useQualificationTabs } from "./qualification/useQualificationTabs";

export function useQualifications() {
  const { currentUser, isLoading: isUserLoading } = useUser();
  const { activeTab, setActiveTab } = useQualificationTabs();
  const { toast } = useToast();

  // Get training data from useTrainingData hook
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

  // Calculate qualifications once we have all required data
  const qualifications: QualificationStatus[] = currentUser && !isLoadingPositions && !isLoadingTrainings
    ? getAllPositionQualifications(
        currentUser.employeeId,
        positions,
        trainingTypes,
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

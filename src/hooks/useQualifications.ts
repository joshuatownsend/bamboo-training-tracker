import { useState, useEffect } from 'react';
import { useTrainingData } from './qualification';
import { useUser } from '@/contexts/user';
import { Training, UserTraining, QualificationStatus } from '@/lib/types';
import { useQualificationTabs } from './qualification';
import { usePositionData } from './qualification/usePositionData';

// Update UserQualification interface to match QualificationStatus properties
export interface UserQualification extends QualificationStatus {
  // Add any additional properties specific to UserQualification
  name: string;
  employeeId: string;
  status: 'completed' | 'pending' | 'expired';
  completionDate: string;
  trainingId: string;
}

export const useQualifications = () => {
  const { currentUser } = useUser();
  const { trainings, isLoading: isLoadingTrainings, error: trainingError } = useTrainingData(currentUser?.employeeId);
  const { positions, isLoading: isLoadingPositions, error: positionsError } = usePositionData();
  const [qualifications, setQualifications] = useState<QualificationStatus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { activeTab, setActiveTab } = useQualificationTabs();

  // Map trainings and completions to qualifications
  useEffect(() => {
    console.log("useQualifications effect running", { 
      isLoadingTrainings, 
      isLoadingPositions,
      trainingCount: trainings?.length || 0,
      positionCount: positions?.length || 0,
      hasError: !!trainingError || !!positionsError 
    });
    
    // Only proceed if we're not loading anymore and have no errors
    if (isLoadingTrainings || isLoadingPositions) {
      setIsLoading(true);
      return;
    }
    
    // Set error state if we have any errors
    if (trainingError || positionsError) {
      console.error("Error in useQualifications:", trainingError || positionsError);
      setError(trainingError || positionsError || new Error("Failed to load qualification data"));
      setIsLoading(false);
      return;
    }
    
    try {
      // Ensure we have both trainings and positions to work with
      if (!trainings || !positions || positions.length === 0) {
        console.log("No trainings or positions data yet", { trainings, positions });
        setQualifications([]);
        setIsLoading(false);
        return;
      }

      console.log("Processing qualifications with", {
        trainingCount: trainings.length,
        positionCount: positions.length
      });
      
      // Map user's completed training IDs for easy lookup
      const userCompletedTrainingIds = trainings.map(t => t.trainingId);
      
      // Map positions to qualifications by evaluating requirements
      const mappedQualifications = positions.map((position): QualificationStatus => {
        // For MVP, simplistic check of array requirement format
        // Will be enhanced later with proper requirement group evaluation
        const countyRequirements = Array.isArray(position.countyRequirements) 
          ? position.countyRequirements 
          : [];
          
        const avfrdRequirements = Array.isArray(position.avfrdRequirements)
          ? position.avfrdRequirements
          : [];
          
        // Check if user meets requirements (simple version)
        const isQualifiedCounty = countyRequirements.length > 0 
          ? countyRequirements.every(reqId => userCompletedTrainingIds.includes(reqId))
          : false;
          
        const isQualifiedAVFRD = avfrdRequirements.length > 0
          ? avfrdRequirements.every(reqId => userCompletedTrainingIds.includes(reqId))
          : false;
          
        // Get missing trainings (simple version) and convert to Training type
        const missingCountyTrainings = countyRequirements
          .filter(reqId => !userCompletedTrainingIds.includes(reqId))
          .map(id => ({ 
            id,
            title: `Training ${id}`,
            category: "Unknown",
            type: "training", // Add required field
            description: "", // Add required field
            durationHours: 0, // Add required field
            requiredFor: [] // Add required field
          }));
          
        const missingAVFRDTrainings = avfrdRequirements
          .filter(reqId => !userCompletedTrainingIds.includes(reqId))
          .map(id => ({ 
            id, 
            title: `Training ${id}`,
            category: "Unknown",
            type: "training", // Add required field
            description: "", // Add required field
            durationHours: 0, // Add required field
            requiredFor: [] // Add required field
          }));
          
        // Return qualification status for position with properly typed Training objects
        return {
          positionId: position.id,
          positionTitle: position.title,
          isQualifiedCounty,
          isQualifiedAVFRD,
          missingCountyTrainings,
          missingAVFRDTrainings,
          completedTrainings: trainings.map(t => ({
            id: t.trainingId,
            title: t.trainingDetails?.title || `Training ${t.trainingId}`,
            category: t.trainingDetails?.category || "Unknown",
            type: "training", // Add required field 
            description: t.trainingDetails?.description || "", // Add required field
            durationHours: t.trainingDetails?.durationHours || 0, // Add required field
            requiredFor: t.trainingDetails?.requiredFor || [] // Add required field
          }))
        };
      });
      
      console.log("Mapped qualifications:", mappedQualifications);
      setQualifications(mappedQualifications);
      setIsLoading(false);
    } catch (err) {
      console.error("Error processing qualifications:", err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setIsLoading(false);
    }
  }, [trainings, positions, isLoadingTrainings, isLoadingPositions, trainingError, positionsError, currentUser?.employeeId]);

  return {
    qualifications,
    isLoading,
    error: error || trainingError || positionsError,
    activeTab,
    setActiveTab,
  };
};

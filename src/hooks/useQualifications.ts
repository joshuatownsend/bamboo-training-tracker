import { useState, useEffect } from 'react';
import { useTrainingData } from './qualification';
import { useUser } from '@/contexts/user';
import { Training, UserTraining, QualificationStatus } from '@/lib/types';
import { useQualificationTabs } from './qualification';
import { usePositionData } from './qualification/usePositionData';
import { useTrainingTypes } from './useTrainingTypes';

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
  const { data: trainingTypesMap, isLoading: isLoadingTypes } = useTrainingTypes();
  const [qualifications, setQualifications] = useState<QualificationStatus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { activeTab, setActiveTab } = useQualificationTabs();

  // Map trainings and completions to qualifications
  useEffect(() => {
    console.log("useQualifications effect running", { 
      isLoadingTrainings, 
      isLoadingPositions,
      isLoadingTypes,
      trainingCount: trainings?.length || 0,
      positionCount: positions?.length || 0,
      hasError: !!trainingError || !!positionsError 
    });
    
    if (isLoadingTrainings || isLoadingPositions || isLoadingTypes) {
      setIsLoading(true);
      return;
    }
    
    if (trainingError || positionsError) {
      console.error("Error in useQualifications:", trainingError || positionsError);
      setError(trainingError || positionsError || new Error("Failed to load qualification data"));
      setIsLoading(false);
      return;
    }
    
    try {
      if (!trainings || !positions || positions.length === 0 || !trainingTypesMap) {
        console.log("Missing required data", { trainings, positions, trainingTypesMap });
        setQualifications([]);
        setIsLoading(false);
        return;
      }

      // Map user's completed training IDs for easy lookup
      const userCompletedTrainingIds = trainings.map(t => t.trainingId);
      
      // Map positions to qualifications
      const mappedQualifications = positions.map((position): QualificationStatus => {
        const getTrainingDetails = (id: string): Training => {
          return trainingTypesMap.get(id) || {
            id,
            title: `Unknown Training ${id}`,
            type: id,
            category: 'Unknown',
            description: '',
            durationHours: 0,
            requiredFor: []
          };
        };
        
        // Handle county requirements
        const countyRequirements = Array.isArray(position.countyRequirements) 
          ? position.countyRequirements 
          : [];
          
        const avfrdRequirements = Array.isArray(position.avfrdRequirements)
          ? position.avfrdRequirements
          : [];
          
        const isQualifiedCounty = countyRequirements.length > 0 
          ? countyRequirements.every(reqId => userCompletedTrainingIds.includes(reqId))
          : false;
          
        const isQualifiedAVFRD = avfrdRequirements.length > 0
          ? avfrdRequirements.every(reqId => userCompletedTrainingIds.includes(reqId))
          : false;
          
        const missingCountyTrainings = countyRequirements
          .filter(reqId => !userCompletedTrainingIds.includes(reqId))
          .map(getTrainingDetails);
          
        const missingAVFRDTrainings = avfrdRequirements
          .filter(reqId => !userCompletedTrainingIds.includes(reqId))
          .map(getTrainingDetails);
          
        const completedTrainings = userCompletedTrainingIds
          .map(getTrainingDetails);
          
        return {
          positionId: position.id,
          positionTitle: position.title,
          isQualifiedCounty,
          isQualifiedAVFRD,
          missingCountyTrainings,
          missingAVFRDTrainings,
          completedTrainings
        };
      });
      
      console.log("Mapped qualifications with training details:", mappedQualifications);
      setQualifications(mappedQualifications);
      setIsLoading(false);
    } catch (err) {
      console.error("Error processing qualifications:", err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setIsLoading(false);
    }
  }, [trainings, positions, isLoadingTrainings, isLoadingPositions, trainingError, positionsError, currentUser?.employeeId, trainingTypesMap, isLoadingTypes]);

  return {
    qualifications,
    isLoading,
    error: error || trainingError || positionsError,
    activeTab,
    setActiveTab,
  };
};

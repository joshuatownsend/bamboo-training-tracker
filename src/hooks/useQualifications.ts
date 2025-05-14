
import { useState, useEffect } from 'react';
import { useTrainingData } from './qualification';
import { useUser } from '@/contexts/user';
import { Training, UserTraining, QualificationStatus } from '@/lib/types';
import { useQualificationTabs } from './qualification';

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
  const trainingDataQuery = useTrainingData(currentUser?.employeeId);
  const [qualifications, setQualifications] = useState<QualificationStatus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { activeTab, setActiveTab } = useQualificationTabs();

  // Map trainings and completions to qualifications
  useEffect(() => {
    setIsLoading(trainingDataQuery.isLoading);
    
    try {
      if (!trainingDataQuery.isLoading && trainingDataQuery.data) {
        const userTrainings = trainingDataQuery.data;
        
        // Map trainings to qualifications (simplified approach)
        const mappedQualifications = userTrainings.map((training): QualificationStatus => ({
          positionId: 'default',
          positionTitle: training.trainingDetails?.title || `Training ${training.trainingId}`,
          isQualifiedCounty: true,
          isQualifiedAVFRD: false,
          missingCountyTrainings: [],
          missingAVFRDTrainings: [],
          completedTrainings: []
        }));

        setQualifications(mappedQualifications);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    }
  }, [trainingDataQuery.data, trainingDataQuery.isLoading, currentUser]);

  // Mock function for position qualifications - this would be replaced with actual logic
  const getPositionQualifications = (): QualificationStatus[] => {
    // This is a placeholder - in a real implementation, this would assess the user's
    // completions against position requirements from the database
    return [{
      positionId: 'driver',
      positionTitle: 'Engine Driver',
      isQualifiedCounty: false,
      isQualifiedAVFRD: false,
      missingCountyTrainings: [],
      missingAVFRDTrainings: [],
      completedTrainings: []
    }];
  };

  return {
    qualifications,
    isLoading: trainingDataQuery.isLoading || isLoading,
    error: trainingDataQuery.error || error,
    activeTab,
    setActiveTab,
    getPositionQualifications,
  };
};

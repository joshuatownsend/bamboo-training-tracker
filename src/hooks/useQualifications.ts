
import { useState, useEffect } from 'react';
import { useTrainingData } from './qualification';
import { useUser } from '@/contexts/user';
import { Training, TrainingCompletion, QualificationStatus } from '@/lib/types';
import { CachedTraining, CachedCompletion } from '@/types/bamboo';
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
  const { trainings, completions, isLoading, error } = useTrainingData();
  const [qualifications, setQualifications] = useState<QualificationStatus[]>([]);
  const { currentUser } = useUser();
  const { activeTab, setActiveTab } = useQualificationTabs();

  // Map trainings and completions to qualifications
  useEffect(() => {
    if (!isLoading && trainings.length > 0 && completions.length > 0) {
      // Create a mapping of training IDs to names for easy lookup
      const trainingMap = new Map<string, string>();
      trainings.forEach((training) => {
        trainingMap.set(training.id, training.title);
      });

      // Filter completions for the current user
      const userCompletions = currentUser ? 
        completions.filter(c => c.employeeId === currentUser.id) : 
        completions;

      // Map completions to qualifications
      const mappedQualifications = userCompletions.map((completion): QualificationStatus => ({
        positionId: 'default',
        positionTitle: trainingMap.get(completion.trainingId) || `Training ${completion.trainingId}`,
        isQualifiedCounty: true,
        isQualifiedAVFRD: false,
        missingCountyRequirements: [],
        missingAVFRDRequirements: [],
        missingCountyTrainings: [],
        missingAVFRDTrainings: [],
        completedTrainings: []
      }));

      setQualifications(mappedQualifications);
    }
  }, [trainings, completions, isLoading, currentUser]);

  // Mock function for position qualifications - this would be replaced with actual logic
  const getPositionQualifications = (): QualificationStatus[] => {
    // This is a placeholder - in a real implementation, this would assess the user's
    // completions against position requirements from the database
    return [{
      positionId: 'driver',
      positionTitle: 'Engine Driver',
      isQualifiedCounty: false,
      isQualifiedAVFRD: false,
      missingCountyRequirements: ['EVOC', 'Engine Operations'],
      missingAVFRDRequirements: ['EVOC', 'Engine Operations', 'Pump Operations'],
      missingCountyTrainings: [],
      missingAVFRDTrainings: [],
      completedTrainings: []
    }];
  };

  return {
    qualifications,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    getPositionQualifications,
  };
};

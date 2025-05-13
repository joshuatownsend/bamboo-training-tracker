
import { useState, useEffect } from 'react';
import { useTrainingData } from './qualification';
import { useUser } from '@/contexts/user';
import { Training, TrainingCompletion } from '@/lib/types';
import { CachedTraining, CachedCompletion } from '@/types/bamboo';
import { useQualificationTabs } from './qualification';

// Interface for UserQualification object
export interface UserQualification {
  id: string;
  name: string;
  trainingId: string;
  employeeId: string;
  status: 'completed' | 'pending' | 'expired';
  completionDate: string;
}

// Interface for QualificationStatus object
export interface QualificationStatus {
  id: string;
  positionId: string;
  positionTitle: string;
  isQualifiedCounty: boolean;
  isQualifiedAVFRD: boolean;
  missingCountyRequirements: string[];
  missingAVFRDRequirements: string[];
}

export const useQualifications = () => {
  const { trainings, completions, isLoading, error } = useTrainingData();
  const [qualifications, setQualifications] = useState<UserQualification[]>([]);
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
      const mappedQualifications = userCompletions.map((completion): UserQualification => ({
        id: completion.id,
        name: trainingMap.get(completion.trainingId) || `Training ${completion.trainingId}`,
        trainingId: completion.trainingId,
        employeeId: completion.employeeId,
        status: 'completed',
        completionDate: completion.completionDate || '',
      }));

      setQualifications(mappedQualifications);
    }
  }, [trainings, completions, isLoading, currentUser]);

  // Mock function for position qualifications - this would be replaced with actual logic
  const getPositionQualifications = (): QualificationStatus[] => {
    // This is a placeholder - in a real implementation, this would assess the user's
    // completions against position requirements from the database
    return [{
      id: '1',
      positionId: 'driver',
      positionTitle: 'Engine Driver',
      isQualifiedCounty: false,
      isQualifiedAVFRD: false,
      missingCountyRequirements: ['EVOC', 'Engine Operations'],
      missingAVFRDRequirements: ['EVOC', 'Engine Operations', 'Pump Operations'],
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

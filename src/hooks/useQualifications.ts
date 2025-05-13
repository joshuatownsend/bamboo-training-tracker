
import { useState, useEffect } from 'react';
import { useTrainingData } from './qualification';
import { useUser } from '@/contexts/user';
import { Training, TrainingCompletion, QualificationStatus } from '@/lib/types';
import { CachedTraining, CachedCompletion } from '@/types/bamboo';
import { useQualificationTabs } from './qualification';

// Interface for UserQualification object - updated to match QualificationStatus properties
export interface UserQualification {
  id: string;
  name: string;
  trainingId: string;
  employeeId: string;
  status: 'completed' | 'pending' | 'expired';
  completionDate: string;
  // Add missing properties to match QualificationStatus
  positionId: string;
  positionTitle: string;
  isQualifiedCounty: boolean;
  isQualifiedAVFRD: boolean;
  missingCountyRequirements: string[];
  missingAVFRDRequirements: string[];
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
        id: completion.id,
        name: trainingMap.get(completion.trainingId) || `Training ${completion.trainingId}`,
        trainingId: completion.trainingId,
        employeeId: completion.employeeId,
        status: 'completed',
        completionDate: completion.completionDate || '',
        // Add required QualificationStatus properties
        positionId: 'default',
        positionTitle: trainingMap.get(completion.trainingId) || 'Unknown Position',
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
      id: '1',
      positionId: 'driver',
      positionTitle: 'Engine Driver',
      isQualifiedCounty: false,
      isQualifiedAVFRD: false,
      missingCountyRequirements: ['EVOC', 'Engine Operations'],
      missingAVFRDRequirements: ['EVOC', 'Engine Operations', 'Pump Operations'],
      missingCountyTrainings: [],
      missingAVFRDTrainings: [],
      completedTrainings: [],
      // Add these properties to make it work with UserQualification
      name: 'Engine Driver Qualification',
      trainingId: 'driver-training',
      employeeId: currentUser?.id || '',
      status: 'completed',
      completionDate: new Date().toISOString().split('T')[0]
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

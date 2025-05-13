
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/user';
import { Training, QualificationStatus } from '@/lib/types';
import type { CachedCompletion, CachedTraining } from '@/types/bamboo';
import { useQualificationTabs } from './qualification';

// Define the interface for our qualification
interface UserQualification {
  id: string;
  name: string;
  trainingId: string;
  employeeId: string;
  status: 'completed' | 'not-started' | 'in-progress' | 'expired';
  completionDate: string | null;
}

export function useQualifications() {
  const { currentUser } = useUser();
  const { activeTab, setActiveTab } = useQualificationTabs();

  // Fetch cached training data
  const { data: trainingsData = [], isLoading: isTrainingsLoading } = useQuery({
    queryKey: ['cached-trainings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cached_trainings')
        .select('*');

      if (error) {
        console.error('Error fetching cached trainings:', error);
        return [];
      }
      
      // Map database fields to needed types
      return data.map(item => ({
        id: item.id,
        title: item.title,
        name: item.title, // Add name property for CachedTraining compatibility
        type: item.type || '',
        category: item.category || '',
        description: item.description || '',
        duration_hours: item.duration_hours || 0,
        required_for: item.required_for || []
      }));
    },
  });

  // Fetch cached training completions for the current user
  const { data: completions = [], isLoading: isCompletionsLoading, error: completionsError } = useQuery({
    queryKey: ['cached-completions', currentUser?.bambooEmployeeId],
    queryFn: async () => {
      if (!currentUser?.bambooEmployeeId) return [];

      const { data, error } = await supabase
        .from('cached_training_completions')
        .select('*')
        .eq('employee_id', currentUser.bambooEmployeeId);

      if (error) {
        console.error('Error fetching cached training completions:', error);
        return [];
      }
      return data as CachedCompletion[];
    },
    enabled: !!currentUser?.bambooEmployeeId,
  });

  // Map CachedCompletion objects to TrainingCompletion format
  const mapCompletions = useMemo(() => completions.map(completion => ({
    id: completion.id || '',
    employeeId: completion.employee_id,
    trainingId: completion.training_id,
    completionDate: completion.completionDate || '',
    expirationDate: completion.expirationDate,
    status: completion.status as 'completed' | 'expired' | 'due' || 'completed',
    score: completion.score,
    certificateUrl: completion.certificateUrl
  })), [completions]);

  // Calculate qualifications once we have all required data
  const qualifications = useMemo(() => {
    if (!trainingsData.length) {
      return [];
    }

    // Transform into UserQualification objects
    return trainingsData.map(training => {
      const completed = mapCompletions.find(
        completion => completion.trainingId === training.id
      );

      let status: UserQualification['status'] = 'not-started';
      if (completed) {
        status = 'completed';
      }

      return {
        id: training.id,
        name: training.title,
        trainingId: training.id,
        employeeId: currentUser?.bambooEmployeeId || '',
        status: status,
        completionDate: completed?.completionDate || null,
      };
    });
  }, [trainingsData, mapCompletions, currentUser?.bambooEmployeeId]);

  // Transform qualifications into QualificationStatus objects for component compatibility
  const qualificationStatuses = useMemo(() => {
    // Mock data for position qualifications
    // In a real implementation, this would be fetched from a database
    const mockPositions = [
      {
        id: 'pos1',
        title: 'Engine Driver',
        countyRequirements: ['training1', 'training2'],
        avfrdRequirements: ['training1', 'training2', 'training3']
      },
      {
        id: 'pos2',
        title: 'Firefighter',
        countyRequirements: ['training4', 'training5'],
        avfrdRequirements: ['training4', 'training5', 'training6']
      }
    ];
    
    return mockPositions.map(position => {
      // Check county qualifications
      const hasAllCountyReqs = position.countyRequirements.every(reqId => 
        qualifications.some(q => q.trainingId === reqId && q.status === 'completed')
      );
      
      // Check AVFRD qualifications
      const hasAllAVFRDReqs = position.avfrdRequirements.every(reqId => 
        qualifications.some(q => q.trainingId === reqId && q.status === 'completed')
      );
      
      // Get missing county trainings
      const missingCountyTrainings = position.countyRequirements
        .filter(reqId => !qualifications.some(q => q.trainingId === reqId && q.status === 'completed'))
        .map(reqId => {
          const training = trainingsData.find(t => t.id === reqId);
          return {
            id: reqId,
            title: training?.title || 'Unknown Training',
            type: training?.type || '',
            category: training?.category || '',
            description: training?.description || '',
            durationHours: training?.duration_hours || 0,
            requiredFor: training?.required_for || []
          } as Training;
        });
      
      // Get missing AVFRD trainings
      const missingAVFRDTrainings = position.avfrdRequirements
        .filter(reqId => !qualifications.some(q => q.trainingId === reqId && q.status === 'completed'))
        .map(reqId => {
          const training = trainingsData.find(t => t.id === reqId);
          return {
            id: reqId,
            title: training?.title || 'Unknown Training',
            type: training?.type || '',
            category: training?.category || '',
            description: training?.description || '',
            durationHours: training?.duration_hours || 0,
            requiredFor: training?.required_for || []
          } as Training;
        });
      
      // Get completed trainings
      const completedTrainings = qualifications
        .filter(q => q.status === 'completed')
        .map(q => {
          const training = trainingsData.find(t => t.id === q.trainingId);
          return {
            id: q.trainingId,
            title: training?.title || 'Unknown Training',
            type: training?.type || '',
            category: training?.category || '',
            description: training?.description || '',
            durationHours: training?.duration_hours || 0,
            requiredFor: training?.required_for || []
          } as Training;
        });
      
      return {
        positionId: position.id,
        positionTitle: position.title,
        isQualifiedCounty: hasAllCountyReqs,
        isQualifiedAVFRD: hasAllAVFRDReqs,
        missingCountyTrainings,
        missingAVFRDTrainings,
        completedTrainings
      } as QualificationStatus;
    });
  }, [qualifications, trainingsData]);

  const isLoading = isTrainingsLoading || isCompletionsLoading;
  const error = completionsError;

  return {
    qualifications: qualificationStatuses, // Return QualificationStatus[] for component compatibility
    isLoading,
    error,
    activeTab,
    setActiveTab
  };
}

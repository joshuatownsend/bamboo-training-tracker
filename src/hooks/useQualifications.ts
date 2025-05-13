import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/user';
import type { Qualification } from '@/lib/types';
import type { CachedCompletion, CachedTraining } from '@/types/bamboo';

export function useQualifications() {
  const { currentUser } = useUser();

  // Fetch cached training data
  const { data: trainings = [], isLoading: isTrainingsLoading } = useQuery({
    queryKey: ['cached-trainings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cached_trainings')
        .select('*');

      if (error) {
        console.error('Error fetching cached trainings:', error);
        return [];
      }
      return data as CachedTraining[];
    },
  });

  // Fetch cached training completions for the current user
  const { data: completions = [], isLoading: isCompletionsLoading } = useQuery({
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
    if (!trainings.length || !mapCompletions.length) {
      return [];
    }

    return trainings.map(training => {
      const completed = mapCompletions.find(
        completion => completion.trainingId === training.id
      );

      let status: Qualification['status'] = 'not-started';
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
  }, [trainings, mapCompletions, currentUser?.bambooEmployeeId]);

  const isLoading = isTrainingsLoading || isCompletionsLoading;

  return {
    qualifications,
    isLoading,
  };
}

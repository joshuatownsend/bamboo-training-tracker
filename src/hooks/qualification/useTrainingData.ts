
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Training, TrainingCompletion } from '@/lib/types';
import { useUser } from '@/contexts/user';
import type { CachedCompletion } from '@/types/bamboo';

export function useTrainingData() {
  const { currentUser } = useUser();

  // Fetch trainings from cached_trainings table
  const { data: cachedTrainings = [], isLoading: isTrainingsLoading } = useQuery({
    queryKey: ['cached-trainings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cached_trainings').select('*');
      if (error) {
        console.error('Error fetching trainings:', error);
        return [];
      }
      
      // Map database fields to Training type
      return data.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type || '',
        category: item.category || '',
        description: item.description || '',
        durationHours: item.duration_hours || 0,
        requiredFor: item.required_for || []
      })) as Training[];
    }
  });

  // Fetch user's training completions
  const { data: cachedCompletions = [], isLoading: isCompletionsLoading } = useQuery({
    queryKey: ['cached-completions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.bambooEmployeeId) return [];
      
      const { data, error } = await supabase
        .from('cached_training_completions')
        .select('*')
        .eq('employee_id', currentUser.bambooEmployeeId);
      
      if (error) {
        console.error('Error fetching completions:', error);
        return [];
      }
      
      return data as CachedCompletion[];
    },
    enabled: !!currentUser?.bambooEmployeeId
  });

  // Convert cached completions to the expected TrainingCompletion format
  const mappedCompletions = useMemo(() => {
    return cachedCompletions.map((completion): TrainingCompletion => ({
      id: completion.id || '',
      employeeId: completion.employee_id,
      trainingId: completion.training_id,
      completionDate: completion.completionDate || '',
      status: 'completed',
      score: completion.score
    }));
  }, [cachedCompletions]);

  return {
    trainings: cachedTrainings,
    completions: mappedCompletions,
    isTrainingsLoading,
    isCompletionsLoading,
    isLoading: isTrainingsLoading || isCompletionsLoading
  };
}

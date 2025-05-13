
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Training, TrainingCompletion } from '@/lib/types';
import { CachedTraining, CachedCompletion } from '@/types/bamboo';

export const useTrainingData = () => {
  const {
    data: trainings = [],
    isLoading: isTrainingsLoading,
    error: trainingsError
  } = useQuery({
    queryKey: ['cached_trainings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cached_trainings').select('*');
      if (error) throw error;
      
      // Map database columns to Training type
      return data.map((training): Training => ({
        id: training.id,
        title: training.title,
        type: training.type || '',
        category: training.category || '',
        description: training.description || '',
        durationHours: parseFloat(training.duration_hours?.toString() || '0'),
        requiredFor: training.required_for || [],
      }));
    },
  });

  const {
    data: completions = [],
    isLoading: isCompletionsLoading,
    error: completionsError
  } = useQuery({
    queryKey: ['cached_training_completions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cached_training_completions').select('*');
      if (error) throw error;
      
      // Map database columns to TrainingCompletion type
      return data.map((completion): TrainingCompletion => ({
        id: completion.id || `${completion.employee_id}-${completion.training_id}`,
        employeeId: completion.employee_id,
        trainingId: completion.training_id,
        completionDate: completion.completion_date || '',
        expirationDate: completion.expiration_date || undefined,
        status: completion.status as 'completed' || 'completed',
        score: completion.score ? parseFloat(completion.score?.toString() || '0') : undefined,
        certificateUrl: completion.certificate_url,
      }));
    },
  });

  const isLoading = isTrainingsLoading || isCompletionsLoading;
  const error = trainingsError || completionsError;

  return {
    trainings,
    completions,
    isLoading,
    error,
  };
};

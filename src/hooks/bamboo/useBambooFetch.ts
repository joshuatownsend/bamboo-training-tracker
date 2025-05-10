
import { useCallback, useState } from 'react';
import { Training, UserTraining } from '@/lib/types';
import { isBambooConfigured } from '@/lib/bamboohr/config';
import { useToast } from '@/hooks/use-toast';
import { getBambooService } from '@/services/dataCacheService';

/**
 * Hook for BambooHR data fetching operations
 */
export const useBambooFetch = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const isConfigured = isBambooConfigured();
  
  // Fetch data from BambooHR
  const fetchData = useCallback(async () => {
    if (!isConfigured) {
      setError('BambooHR is not configured.');
      toast({
        title: "BambooHR Error",
        description: "BambooHR is not configured. Please check settings.",
        variant: "destructive"
      });
      return { employees: [], trainings: [], completions: [] };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const service = getBambooService();
      const data = await service.fetchAllData();
      console.log("Data fetched from BambooHR:", data ? "Success" : "No data");
      return data || { employees: [], trainings: [], completions: [] };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error("Error fetching BambooHR data:", errorMessage);
      
      toast({
        title: "BambooHR Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { employees: [], trainings: [], completions: [] };
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, toast]);
  
  // Fetch trainings specifically
  const fetchTrainings = useCallback(async (): Promise<Training[]> => {
    if (!isConfigured) {
      setError('BambooHR is not configured.');
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const service = getBambooService();
      const trainings = await service.getTrainings();
      console.log("Trainings fetched from BambooHR:", trainings.length);
      return trainings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error("Error fetching trainings:", errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);
  
  // Fetch trainings for a specific employee
  const fetchUserTrainings = useCallback(async (employeeId: string): Promise<UserTraining[]> => {
    if (!isConfigured) {
      setError('BambooHR is not configured.');
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Attempting to fetch trainings for employee ID:", employeeId);
      const service = getBambooService();
      const trainings = await service.getUserTrainings(employeeId);
      console.log(`User trainings fetched from BambooHR for employee ${employeeId}:`, trainings.length);
      return trainings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error("Error fetching user trainings:", errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  return {
    isLoading,
    error,
    fetchData,
    fetchTrainings,
    fetchUserTrainings,
    isConfigured
  };
};

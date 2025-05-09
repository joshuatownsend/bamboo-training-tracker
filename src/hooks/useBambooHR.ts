
import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import BambooHRApiClient from '@/lib/bamboohr/api';
import { getEffectiveBambooConfig, isBambooConfigured } from '@/lib/bamboohr/config';
import { useToast } from '@/hooks/use-toast';
import { Training, UserTraining } from '@/lib/types';
import useEmployeeMapping from '@/hooks/useEmployeeMapping';

const useBambooHR = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { getEmployeeIdByEmail } = useEmployeeMapping();
  
  const isConfigured = isBambooConfigured();
  
  // Get a configured BambooHR service instance
  const getBambooService = useCallback(() => {
    const config = getEffectiveBambooConfig();
    if (!config.useEdgeFunction && !config.subdomain) {
      throw new Error('BambooHR is not configured. Add your subdomain and API key in Admin Settings or use Edge Function.');
    }
    return new BambooHRApiClient({
      subdomain: config.subdomain,
      apiKey: config.apiKey,
      useEdgeFunction: config.useEdgeFunction,
      edgeFunctionUrl: config.edgeFunctionUrl
    });
  }, []);
  
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
  }, [isConfigured, getBambooService, toast]);
  
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
  }, [isConfigured, getBambooService]);
  
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
  }, [isConfigured, getBambooService]);
  
  // React Query hook to fetch all BambooHR data
  const useAllData = () => {
    return useQuery({
      queryKey: ['bamboohr', 'allData'],
      queryFn: async () => {
        if (!isConfigured) {
          console.log('BambooHR is not configured, returning empty data');
          return { employees: [], trainings: [], completions: [] };
        }
        try {
          const service = getBambooService();
          const result = await service.fetchAllData();
          console.log("Query fetched data:", result ? "Success" : "No data");
          
          // Show success toast if we got data
          if (result && result.employees && result.employees.length > 0) {
            toast({
              title: "BambooHR Data Loaded",
              description: `Successfully loaded ${result.employees.length} employees`,
              variant: "default"
            });
          }
          
          return result || { employees: [], trainings: [], completions: [] };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          console.error('Error in useAllData:', errorMessage);
          
          toast({
            title: "BambooHR Error",
            description: errorMessage,
            variant: "destructive"
          });
          
          throw new Error(errorMessage);
        }
      },
      enabled: isConfigured, // Only run the query if BambooHR is configured
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
    });
  };
  
  // React Query hook to fetch just trainings
  const useTrainings = () => {
    return useQuery({
      queryKey: ['bamboohr', 'trainings'],
      queryFn: fetchTrainings,
      enabled: isConfigured,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    });
  };
  
  // React Query hook to fetch user trainings
  const useUserTrainings = (employeeId?: string) => {
    return useQuery({
      queryKey: ['bamboohr', 'userTrainings', employeeId],
      queryFn: async () => {
        if (!employeeId) {
          console.log("No employeeId provided for user trainings fetch");
          return [];
        }
        console.log(`Fetching user trainings for employeeId: ${employeeId}`);
        return fetchUserTrainings(employeeId);
      },
      enabled: isConfigured && !!employeeId,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    });
  };
  
  return {
    isLoading,
    error,
    fetchData,
    fetchTrainings,
    fetchUserTrainings,
    isConfigured,
    getBambooService,
    useAllData,
    useTrainings,
    useUserTrainings
  };
};

export default useBambooHR;


import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isBambooConfigured } from '@/lib/bamboohr/config';
import { useToast } from '@/hooks/use-toast';
import { getBambooService, prefetchBambooHRData } from '@/services/dataCacheService';

/**
 * Hook for BambooHR React Query-based data access
 */
export const useBambooQueries = () => {
  const { toast } = useToast();
  const isConfigured = isBambooConfigured();

  // React Query hook to fetch all BambooHR data
  const useAllData = useCallback(() => {
    return useQuery({
      queryKey: ['bamboohr', 'allData'],
      queryFn: async () => {
        if (!isConfigured) {
          console.log('BambooHR is not configured, returning empty data');
          return { employees: [], trainings: [], completions: [] };
        }
        
        try {
          // Try to prefetch data in background if not available in cache
          prefetchBambooHRData().catch(console.error);
          
          const service = getBambooService();
          const result = await service.fetchAllData();
          console.log("Query fetched data:", result ? "Success" : "No data");
          
          if (result && result.employees && result.employees.length > 0) {
            console.log(`Successfully loaded ${result.employees.length} employees from BambooHR`);
            
            // Only show toast for successful data loads, not empty results
            toast({
              title: "BambooHR Data Loaded",
              description: `Successfully loaded ${result.employees.length} employees`,
              variant: "default"
            });
          }
          
          // Return actual result, even if empty
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
  }, [isConfigured, toast]);
  
  // React Query hook to fetch just trainings
  const useTrainings = useCallback(() => {
    return useQuery({
      queryKey: ['bamboohr', 'trainings'],
      queryFn: async () => {
        if (!isConfigured) {
          return [];
        }
        
        const service = getBambooService();
        return service.getTrainings();
      },
      enabled: isConfigured,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    });
  }, [isConfigured]);
  
  // React Query hook to fetch user trainings
  const useUserTrainings = useCallback((employeeId?: string) => {
    return useQuery({
      queryKey: ['bamboohr', 'userTrainings', employeeId],
      queryFn: async () => {
        if (!employeeId) {
          console.log("No employeeId provided for user trainings fetch");
          return [];
        }
        console.log(`Fetching user trainings for employeeId: ${employeeId}`);
        
        const service = getBambooService();
        return service.getUserTrainings(employeeId);
      },
      enabled: isConfigured && !!employeeId,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    });
  }, [isConfigured]);

  return {
    useAllData,
    useTrainings,
    useUserTrainings
  };
};

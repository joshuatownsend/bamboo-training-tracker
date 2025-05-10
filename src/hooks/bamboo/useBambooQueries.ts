
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
          console.log('Fetching BambooHR data for UI...');
          
          // Try to prefetch data in background if not available in cache
          try {
            await prefetchBambooHRData().catch(err => {
              console.error("Error in prefetch:", err);
            });
          } catch (prefetchError) {
            console.warn("Prefetch attempt failed:", prefetchError);
            // Continue with direct fetch even if prefetch fails
          }
          
          const service = getBambooService();
          
          // Use regular mode for UI data loading (not connection test mode)
          const result = await service.fetchAllData();
          
          if (!result) {
            console.error("BambooHR API returned null or undefined result");
            return {
              employees: [],
              trainings: [],
              completions: [],
              partialData: true,
              error: "Empty response from BambooHR API"
            };
          }
          
          // Ensure we always return objects, even if undefined
          const normalizedResult = {
            employees: result?.employees || [],
            trainings: result?.trainings || [],
            completions: result?.completions || [],
            partialData: result?.partialData || false,
            error: result?.error || null
          };
          
          console.log("Query fetched data:", normalizedResult);
          console.log(`Employees count: ${normalizedResult.employees.length}`);
          console.log(`Trainings count: ${normalizedResult.trainings.length}`);
          console.log(`Completions count: ${normalizedResult.completions.length}`);
          
          // Validate employees data structure
          if (normalizedResult.employees && normalizedResult.employees.length > 0) {
            // Log a sample employee
            console.log("Sample employee:", normalizedResult.employees[0]);
            
            // Check for required fields
            const missingIds = normalizedResult.employees.filter(e => !e.id).length;
            if (missingIds > 0) {
              console.warn(`Warning: ${missingIds} employees are missing ID fields`);
            }
          } else {
            console.warn("No employees found in the API response");
          }
          
          return normalizedResult;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          console.error('Error in useAllData:', errorMessage);
          
          // Don't show toast for timeout errors - these are handled gracefully with partial data
          if (!errorMessage.includes('timed out') && !errorMessage.includes('timeout')) {
            toast({
              title: "BambooHR Error",
              description: errorMessage,
              variant: "destructive"
            });
          }
          
          // Return a partial result if the error is related to timeouts
          if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
            console.warn('Timeout occurred, but returning partial data that was successfully loaded');
            return { 
              employees: [], 
              trainings: [], 
              completions: [],
              partialData: true,
              error: errorMessage
            };
          }
          
          throw new Error(errorMessage);
        }
      },
      enabled: isConfigured, // Only run the query if BambooHR is configured
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 2, // Retry failed requests up to 2 times
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
      retry: 2,
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
      retry: 2,
    });
  }, [isConfigured]);

  return {
    useAllData,
    useTrainings,
    useUserTrainings
  };
};

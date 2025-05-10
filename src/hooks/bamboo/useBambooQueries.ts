
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
          // Use regular mode for UI data loading (not connection test mode)
          const result = await service.fetchAllData(false);
          console.log("Query fetched data:", result ? "Success" : "No data");
          
          if (result && result.employees && result.employees.length > 0) {
            console.log(`Successfully loaded ${result.employees.length} employees from BambooHR`);
            console.log(`Successfully loaded ${result.trainings?.length || 0} trainings from BambooHR`);
            console.log(`Successfully loaded ${result.completions?.length || 0} training completions from BambooHR`);
            
            // Log some sample data for debugging
            if (result.completions && result.completions.length > 0) {
              const futureCompletions = result.completions.filter(c => {
                if (!c.completionDate) return false;
                const completionDate = new Date(c.completionDate);
                return completionDate > new Date();
              });
              
              console.log(`Found ${futureCompletions.length} completions with future dates`);
              if (futureCompletions.length > 0) {
                console.log("Sample future completion:", futureCompletions[0]);
              }
            }
            
            // Show toast only for successful data loads with data to show
            if (result.employees.length > 0) {
              toast({
                title: "BambooHR Data Loaded",
                description: `Successfully loaded ${result.employees.length} employees`,
                variant: "default"
              });
            }
          }
          
          // Return actual result, even if empty
          return result || { employees: [], trainings: [], completions: [] };
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
        // Use a timeout of 8 seconds for individual user training fetches 
        return service.getUserTrainings(employeeId, 8000);
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

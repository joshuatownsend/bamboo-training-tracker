
import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import BambooHRService from '@/lib/bamboohr/api';
import { getEffectiveBambooConfig, isBambooConfigured } from '@/lib/bamboohr/config';

const useBambooHR = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const isConfigured = isBambooConfigured();
  
  // Get a configured BambooHR service instance
  const getBambooService = useCallback(() => {
    const config = getEffectiveBambooConfig();
    if (!config.subdomain || !config.apiKey) {
      throw new Error('BambooHR is not configured. Add your subdomain and API key in Admin Settings.');
    }
    return new BambooHRService({
      subdomain: config.subdomain,
      apiKey: config.apiKey,
      useEdgeFunction: config.useEdgeFunction
    });
  }, []);
  
  // Fetch data from BambooHR
  const fetchData = useCallback(async () => {
    if (!isConfigured) {
      setError('BambooHR is not configured.');
      return { employees: [], trainings: [], completions: [] };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const service = getBambooService();
      const data = await service.fetchAllData();
      return data || { employees: [], trainings: [], completions: [] };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { employees: [], trainings: [], completions: [] };
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
          return result || { employees: [], trainings: [], completions: [] };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          console.error('Error in useAllData:', errorMessage);
          throw new Error(errorMessage);
        }
      },
      enabled: true // Always enable the query, but return empty data if not configured
    });
  };
  
  return {
    isLoading,
    error,
    fetchData,
    isConfigured,
    getBambooService,
    useAllData
  };
};

export default useBambooHR;


import { useCallback, useState } from 'react';
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
      useProxy: config.useProxy
    });
  }, []);
  
  // Fetch data from BambooHR
  const fetchData = useCallback(async () => {
    if (!isConfigured) {
      setError('BambooHR is not configured.');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const service = getBambooService();
      const data = await service.fetchAllData();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, getBambooService]);
  
  return {
    isLoading,
    error,
    fetchData,
    isConfigured,
    getBambooService
  };
};

export default useBambooHR;

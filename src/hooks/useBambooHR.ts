
import { useCallback } from 'react';
import { useBambooFetch } from './bamboo/useBambooFetch';
import { useBambooQueries } from './bamboo/useBambooQueries';
import { getBambooService } from '@/services/dataCacheService';

/**
 * Main hook for BambooHR functionality
 */
const useBambooHR = () => {
  // Import all the fetching capabilities
  const { 
    isLoading, 
    error, 
    fetchData, 
    fetchTrainings, 
    fetchUserTrainings,
    isConfigured
  } = useBambooFetch();

  // Import all the query capabilities
  const {
    useAllData,
    useTrainings,
    useUserTrainings
  } = useBambooQueries();

  return {
    // Fetch methods
    isLoading,
    error,
    fetchData,
    fetchTrainings,
    fetchUserTrainings,
    
    // Configuration and service
    isConfigured,
    getBambooService,
    
    // React Query hooks
    useAllData,
    useTrainings,
    useUserTrainings
  };
};

export default useBambooHR;

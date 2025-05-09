
import { QueryClient } from '@tanstack/react-query';
import BambooHRApiClient from '@/lib/bamboohr/api';
import { getEffectiveBambooConfig, isBambooConfigured } from '@/lib/bamboohr/config';

// Singleton instance for the query client
let queryClientInstance: QueryClient | null = null;

// Initialize the query client (should be called in App.tsx or similar)
export const initializeQueryClient = (queryClient: QueryClient) => {
  queryClientInstance = queryClient;
};

// Get the query client instance
export const getQueryClient = (): QueryClient => {
  if (!queryClientInstance) {
    throw new Error('Query client not initialized. Call initializeQueryClient first.');
  }
  return queryClientInstance;
};

// Get a configured BambooHR service instance
export const getBambooService = () => {
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
};

// Prefetch BambooHR data and store in the React Query cache
export const prefetchBambooHRData = async () => {
  try {
    if (!isBambooConfigured()) {
      console.log('BambooHR is not configured, skipping prefetch');
      return false;
    }

    console.log('Prefetching BambooHR data...');
    const queryClient = getQueryClient();
    const service = getBambooService();
    
    // Fetch the data
    const data = await service.fetchAllData();
    
    // Update the React Query cache
    if (data) {
      queryClient.setQueryData(['bamboohr', 'allData'], data);
      console.log('BambooHR data prefetched and cached');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error prefetching BambooHR data:', error);
    return false;
  }
};

// Set up a background refresh interval (in milliseconds)
export const startBackgroundRefresh = (intervalMs = 5 * 60 * 1000) => {
  // Initial prefetch
  prefetchBambooHRData();
  
  // Set up interval for subsequent prefetches
  const intervalId = setInterval(() => {
    console.log('Running background refresh of BambooHR data');
    prefetchBambooHRData();
  }, intervalMs);
  
  return () => clearInterval(intervalId); // Return cleanup function
};

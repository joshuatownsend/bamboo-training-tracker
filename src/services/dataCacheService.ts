
import { BambooHRApiClient } from "@/lib/bamboohr/client/api-client";
import { getEffectiveBambooConfig } from '@/lib/bamboohr/config';
import { QueryClient } from "@tanstack/react-query";

// Cache for sharing service instances across components
let bambooServiceInstance: BambooHRApiClient | null = null;
let queryClient: QueryClient | null = null;

// Cache for prefetched data
const dataCache: {
  employees?: any[];
  trainings?: any[];
  completions?: any[];
  lastFetch?: number;
} = {};

// Initialize the QueryClient
export function initializeQueryClient(client: QueryClient): void {
  queryClient = client;
  console.log("Query client initialized in dataCacheService");
}

// Start background refresh of data
export function startBackgroundRefresh(): () => void {
  console.log("Starting background refresh of BambooHR data");
  
  // Run the first refresh immediately
  prefetchBambooHRData();
  
  // Set up periodic refresh (every 5 minutes)
  const intervalId = setInterval(() => {
    console.log("Running background refresh of BambooHR data");
    prefetchBambooHRData();
  }, 5 * 60 * 1000);
  
  // Return cleanup function
  return () => {
    console.log("Stopping background refresh");
    clearInterval(intervalId);
  };
}

// Get or create a singleton BambooHR service instance
export function getBambooService(): BambooHRApiClient {
  if (bambooServiceInstance) {
    return bambooServiceInstance;
  }
  
  const config = getEffectiveBambooConfig();
  
  // We create a new BambooHRApiClient instance
  bambooServiceInstance = new BambooHRApiClient({
    subdomain: config.subdomain || 'avfrd',
    apiKey: config.apiKey || '',
    useEdgeFunction: config.useEdgeFunction || false,
    edgeFunctionUrl: config.edgeFunctionUrl || '/api/bamboohr',
  });
  
  return bambooServiceInstance;
}

// Reset the service instance (for testing or when config changes)
export function resetBambooService(): void {
  bambooServiceInstance = null;
  dataCache.lastFetch = undefined;
}

// Prefetch BambooHR data in the background for faster UI loading
export async function prefetchBambooHRData(): Promise<void> {
  // Skip if we have recent data (less than 5 minutes old)
  const now = Date.now();
  const cacheExpiry = 5 * 60 * 1000; // 5 minutes
  
  if (dataCache.lastFetch && now - dataCache.lastFetch < cacheExpiry) {
    console.log("Using cached BambooHR data");
    return;
  }
  
  try {
    console.log("Prefetching BambooHR data in background");
    const service = getBambooService();
    const data = await service.fetchAllData();
    
    if (data) {
      // Log what we got
      console.log(`Prefetched data:`, {
        employeesCount: data.employees?.length || 0,
        trainingsCount: data.trainings?.length || 0,
        completionsCount: data.completions?.length || 0,
      });
      
      if (data.employees && data.employees.length > 0) {
        console.log("Sample employee:", data.employees[0]);
      }
      
      // Update cache
      dataCache.employees = data.employees || [];
      dataCache.trainings = data.trainings || [];
      dataCache.completions = data.completions || [];
      dataCache.lastFetch = now;
      console.log("BambooHR data prefetched and cached");
      
      // Update React Query cache if available
      if (queryClient) {
        queryClient.setQueryData(['bamboohr', 'allData'], data);
        console.log("Updated React Query cache with prefetched data");
      }
    } else {
      console.warn("No data returned from fetchAllData");
    }
  } catch (error) {
    console.error("Error prefetching BambooHR data:", error);
    // Don't update the cache timestamp on error
  }
}

// Get cached data (or fetch if not available)
export async function getCachedEmployees() {
  if (!dataCache.employees) {
    await prefetchBambooHRData();
  }
  return dataCache.employees || [];
}

export async function getCachedTrainings() {
  if (!dataCache.trainings) {
    await prefetchBambooHRData();
  }
  return dataCache.trainings || [];
}

export async function getCachedCompletions() {
  if (!dataCache.completions) {
    await prefetchBambooHRData();
  }
  return dataCache.completions || [];
}

// Clear the cache to force a refresh on next fetch
export function clearBambooCache() {
  dataCache.lastFetch = undefined;
  dataCache.employees = undefined;
  dataCache.trainings = undefined;
  dataCache.completions = undefined;
  console.log("BambooHR cache cleared");
  
  // Also clear React Query cache if available
  if (queryClient) {
    queryClient.invalidateQueries({ queryKey: ['bamboohr'] });
    console.log("React Query cache invalidated");
  }
}

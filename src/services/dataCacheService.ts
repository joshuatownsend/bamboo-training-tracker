
import { BambooHRApiClient } from "@/lib/bamboohr/client/api-client";
import { BambooHRClientInterface } from "@/lib/bamboohr/client/types";
import { getEffectiveBambooConfig } from '@/lib/bamboohr/config';

// Cache for sharing service instances across components
let bambooServiceInstance: BambooHRApiClient | null = null;

// Cache for prefetched data
const dataCache: {
  employees?: any[];
  trainings?: any[];
  completions?: any[];
  lastFetch?: number;
} = {};

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
      // Update cache
      dataCache.employees = data.employees;
      dataCache.trainings = data.trainings;
      dataCache.completions = data.completions;
      dataCache.lastFetch = now;
      console.log("BambooHR data prefetched and cached");
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
}

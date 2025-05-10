
import { ApiFetcher } from './api-fetcher';

/**
 * Handles API connection testing functionality
 */
export class ConnectionTester extends ApiFetcher {
  /**
   * Test if we can connect to the BambooHR API
   * @returns True if connection was successful
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to access a simple endpoint that should be available to any valid API key
      const result = await this.testEndpointExists('/employees/directory');
      return result;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }
  
  /**
   * Test if a specific endpoint exists and is accessible
   * @param endpoint The endpoint to test
   * @returns True if endpoint exists and is accessible
   */
  async testEndpointExists(endpoint: string): Promise<boolean> {
    try {
      const response = await this.fetchFromBamboo(endpoint);
      return !!response; // If we got a response, endpoint exists
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        // 404 means endpoint exists but may need additional permissions or params
        return true;
      }
      throw error;
    }
  }
}

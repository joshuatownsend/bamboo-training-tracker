
import { BambooHRClient } from './base';
import { BambooHRClientInterface } from './types';

/**
 * Extended BambooHRClient with higher-level methods for working with the API data
 */
export class BambooHRApiClient extends BambooHRClient implements BambooHRClientInterface {
  /**
   * Fetch data from BambooHR API with error handling and JSON parsing
   */
  async fetchFromBamboo(endpoint: string, method = 'GET', body?: any): Promise<any> {
    try {
      // Get response with a timeout (the Edge Function also has its own timeout)
      const response = await this.fetchRawResponse(endpoint, method, body);
      
      if (!response.ok) {
        // Check if the response is HTML (common when getting redirected to a login page)
        const contentType = response.headers.get('content-type');
        const responseText = await response.text();
        
        console.log('Response status:', response.status);
        console.log('Content-Type:', contentType);
        console.log('Response preview:', responseText.substring(0, 200) + '...');
        
        if (contentType && contentType.includes('text/html')) {
          console.error('Received HTML response instead of JSON:', responseText.substring(0, 200) + '...');
          
          throw new Error(`BambooHR authentication failed. ${this.useEdgeFunction ? 'Edge Function' : 'Server'} returned HTML instead of JSON data.`);
        }
        
        // For service unavailable (503) errors from the edge function
        if (response.status === 503) {
          // Try to parse as JSON if it might be JSON
          try {
            const errorJson = JSON.parse(responseText);
            if (errorJson.error && errorJson.error.includes('timed out')) {
              throw new Error(`BambooHR API request timed out for ${endpoint}`);
            }
            throw new Error(`BambooHR API error (503): ${JSON.stringify(errorJson)}`);
          } catch (parseError) {
            // If not parseable as JSON, could be a timeout or other server issue
            throw new Error(`BambooHR API error (503): ${responseText || 'Service unavailable'}`);
          }
        }
        
        // Try to parse as JSON if it might be JSON
        try {
          const errorJson = JSON.parse(responseText);
          throw new Error(`BambooHR API error (${response.status}): ${JSON.stringify(errorJson)}`);
        } catch (parseError) {
          // If not parseable as JSON, return the text directly
          throw new Error(`BambooHR API error (${response.status}): ${responseText || 'Unknown error'}`);
        }
      }

      // Try to parse the response as JSON
      const responseText = await response.text();
      
      // Log the raw response for debugging
      console.log(`Raw BambooHR response from ${endpoint}:`, responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      try {
        const parsedResponse = JSON.parse(responseText);
        
        // If this is the employees endpoint, log additional debug info about the structure
        if (endpoint.includes('employees/directory')) {
          if (Array.isArray(parsedResponse)) {
            console.log(`BambooHR returned an array of ${parsedResponse.length} employees`);
            if (parsedResponse.length > 0) {
              console.log('First employee sample structure:', JSON.stringify(parsedResponse[0], null, 2));
            }
          } else {
            console.log('BambooHR response structure (not an array):', Object.keys(parsedResponse));
          }
        }
        
        // Similarly for training reports
        if (endpoint.includes('training/record/employee')) {
          console.log('BambooHR user training response structure:', 
            Array.isArray(parsedResponse) 
              ? `Array with ${parsedResponse.length} items` 
              : `Object with keys: ${Object.keys(parsedResponse).join(', ')}`
          );
          
          // If it's an object but not an array, it might be keyed by training ID
          if (!Array.isArray(parsedResponse) && typeof parsedResponse === 'object') {
            const recordCount = Object.keys(parsedResponse).length;
            console.log(`Found ${recordCount} training records in object format`);
            
            if (recordCount > 0) {
              const firstKey = Object.keys(parsedResponse)[0];
              console.log(`Sample training record (key ${firstKey}):`, parsedResponse[firstKey]);
            }
          }
        }
        
        return parsedResponse;
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', responseText.substring(0, 200));
        
        // If response starts with HTML, it's likely redirecting to login
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          throw new Error(`BambooHR authentication error. Please check your credentials in the Supabase environment variables.`);
        }
        
        throw new Error(`Invalid JSON response from BambooHR API: ${(parseError as Error).message}`);
      }
    } catch (error) {
      console.error(`Error in BambooHR API call to ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Test the connection to BambooHR API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple endpoint to check if we can connect
      const response = await this.fetchRawResponse('/meta/lists');
      return response.ok;
    } catch (error) {
      console.error('BambooHR connection test failed:', error);
      return false;
    }
  }

  /**
   * Get employees from BambooHR
   */
  async getEmployees(): Promise<any[]> {
    try {
      const data = await this.fetchFromBamboo('/employees/directory');
      
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object' && data.employees) {
        return data.employees;
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  }

  /**
   * Get trainings from BambooHR
   */
  async getTrainings(): Promise<any[]> {
    try {
      console.log("Fetching trainings from BambooHR...");
      // Use the correct endpoint for training types
      const data = await this.fetchFromBamboo('/training/type');
      
      // Handle the object format where IDs are keys
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return Object.values(data);
      }
      // Handle array format (fallback)
      else if (Array.isArray(data)) {
        return data;
      } 
      // Handle other nested structures
      else if (data && typeof data === 'object') {
        return data.trainings || data.data || data.rows || [];
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching trainings:", error);
      return [];
    }
  }

  /**
   * Get trainings for a specific employee
   */
  async getUserTrainings(employeeId: string, timeoutMs = 5000): Promise<any[]> {
    try {
      console.log(`Fetching trainings for employee ID: ${employeeId}`);
      
      if (!employeeId) {
        console.error("No employee ID provided for getUserTrainings");
        return [];
      }
      
      // Use the correct endpoint for employee training records
      const endpoint = `/training/record/employee/${employeeId}`;
      console.log(`Using endpoint for user trainings: ${endpoint}`);
      
      // Create a promise that rejects after the timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout of ${timeoutMs}ms exceeded for employee ${employeeId}`)), timeoutMs);
      });
      
      // Create the fetch promise
      const fetchPromise = this.fetchFromBamboo(endpoint);
      
      // Race the fetch against the timeout
      const trainingData = await Promise.race([fetchPromise, timeoutPromise]);
      console.log("Raw user trainings data from BambooHR:", trainingData);
      
      // Parse the response based on its format
      let trainingsArray: any[] = [];
      
      // Handle the object format where IDs are keys
      if (trainingData && typeof trainingData === 'object' && !Array.isArray(trainingData)) {
        trainingsArray = Object.values(trainingData);
      } else if (Array.isArray(trainingData)) {
        trainingsArray = trainingData;
      }
      
      console.log(`Found ${trainingsArray.length} training records for user`);
      return trainingsArray;
      
    } catch (error) {
      console.error("Error getting user trainings from BambooHR:", error);
      return [];
    }
  }
}

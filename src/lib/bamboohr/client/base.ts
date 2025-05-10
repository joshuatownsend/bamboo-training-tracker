
import { BambooApiOptions, BambooHRClientInterface } from './types';

/**
 * Base BambooHR API client class
 * Handles direct communication with the BambooHR API or Edge Function proxy
 */
export class BambooHRClient implements BambooHRClientInterface {
  private subdomain: string;
  private apiKey: string;
  private baseUrl: string;
  private useEdgeFunction: boolean;
  private edgeFunctionUrl: string;
  private retryCount: number = 2; // Add retry capability

  constructor(options: BambooApiOptions) {
    this.subdomain = options.subdomain || '';
    this.apiKey = options.apiKey || '';
    this.useEdgeFunction = options.useEdgeFunction || false;
    this.edgeFunctionUrl = options.edgeFunctionUrl || '/api/bamboohr';
    
    // Set up the base URL for BambooHR API
    this.baseUrl = `https://api.bamboohr.com/api/gateway.php/${this.subdomain}/v1`;
  }
  
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
  
  /**
   * Fetch data from BambooHR API with improved error handling and retry logic
   * @param endpoint API endpoint to fetch
   * @param options Fetch options
   * @returns Response data
   */
  async fetchFromBamboo(endpoint: string, options: RequestInit = {}): Promise<any> {
    let attempt = 0;
    let lastError;
    
    while (attempt <= this.retryCount) {
      try {
        // If using edge function, proxy request through that
        if (this.useEdgeFunction) {
          return await this.fetchThroughEdgeFunction(endpoint, options);
        }
        
        // Direct API call (client-side)
        const url = `${this.baseUrl}${endpoint}`;
        const headers = new Headers({
          'Accept': 'application/json',
          'Authorization': `Basic ${btoa(`${this.apiKey}:x`)}`
        });
        
        console.log(`Direct API fetch to ${url}`);
        
        const response = await fetch(url, {
          ...options,
          headers,
        });
        
        if (!response.ok) {
          let errorMessage = `BambooHR API error (${response.status})`;
          
          try {
            const errorData = await response.json();
            errorMessage = `${errorMessage}: ${JSON.stringify(errorData)}`;
          } catch (e) {
            // If can't parse JSON, use text
            try {
              const errorText = await response.text();
              errorMessage = `${errorMessage}: "${errorText}"`;
            } catch (textError) {
              errorMessage = `${errorMessage}: "Unknown error"`;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        // Check if response is empty
        const text = await response.text();
        if (!text) return null;
        
        // Try to parse as JSON
        try {
          return JSON.parse(text);
        } catch (e) {
          console.warn("Response is not valid JSON:", text.substring(0, 100));
          return text;
        }
      } catch (error) {
        lastError = error;
        console.warn(`API fetch attempt ${attempt + 1} failed:`, error);
        
        // If it's a network error or a 5xx error, retry
        const isRetryableError = error instanceof Error && (
          error.message.includes('network') || 
          error.message.includes('timeout') ||
          error.message.includes('500') ||
          error.message.includes('503')
        );
        
        if (isRetryableError && attempt < this.retryCount) {
          // Add increasing delay before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 500; // 500ms, 1000ms, 2000ms
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        
        throw lastError;
      }
    }
    
    throw lastError;
  }
  
  /**
   * Fetch data through the Edge Function proxy
   * @param endpoint BambooHR API endpoint
   * @param options Fetch options
   * @returns Response data
   */
  private async fetchThroughEdgeFunction(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.edgeFunctionUrl}${endpoint}?subdomain=${this.subdomain}`;
    console.log(`Edge function fetch to ${url}`);
    
    let attempt = 0;
    let lastError;
    
    while (attempt <= this.retryCount) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          let errorMessage = `BambooHR API error (${response.status})`;
          
          try {
            const errorData = await response.json();
            errorMessage = `${errorMessage}: ${JSON.stringify(errorData)}`;
          } catch (e) {
            // If can't parse JSON, use text
            try {
              const errorText = await response.text();
              errorMessage = `${errorMessage}: "${errorText}"`;
            } catch (textError) {
              errorMessage = `${errorMessage}: "Unknown error"`;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        // Check for empty response
        const text = await response.text();
        if (!text) return null;
        
        // Parse JSON response
        try {
          return JSON.parse(text);
        } catch (e) {
          console.warn("Edge function response is not valid JSON:", text.substring(0, 100));
          return text;
        }
      } catch (error) {
        lastError = error;
        console.warn(`Edge function fetch attempt ${attempt + 1} failed:`, error);
        
        // If it's a network error or a 5xx error, retry
        const isRetryableError = error instanceof Error && (
          error.message.includes('network') || 
          error.message.includes('timeout') ||
          error.message.includes('500') ||
          error.message.includes('503')
        );
        
        if (isRetryableError && attempt < this.retryCount) {
          // Add increasing delay before retry
          const delay = Math.pow(2, attempt) * 500;
          console.log(`Retrying edge function in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        
        throw lastError;
      }
    }
    
    throw lastError;
  }
  
  /**
   * Get all employees from BambooHR
   * @returns Array of employee records
   */
  async getEmployees(): Promise<any[]> {
    try {
      console.log("Fetching employees from BambooHR");
      const directory = await this.fetchFromBamboo('/employees/directory');
      
      if (!directory || !Array.isArray(directory.employees)) {
        console.warn("Invalid employee directory response:", directory);
        return [];
      }
      
      console.log(`Found ${directory.employees.length} employees in directory`);
      return directory.employees;
    } catch (error) {
      console.error("Error fetching employees:", error);
      // Fallback to smaller employee directory if available
      try {
        console.log("Trying alternative employee directory endpoint");
        const directoryAlt = await this.fetchFromBamboo('/employees');
        
        if (!directoryAlt || !Array.isArray(directoryAlt)) {
          console.warn("Invalid alternative employee directory response");
          return [];
        }
        
        console.log(`Found ${directoryAlt.length} employees in alternative directory`);
        return directoryAlt;
      } catch (fallbackError) {
        console.error("Fallback employee fetch also failed:", fallbackError);
        return [];
      }
    }
  }
  
  /**
   * Get all trainings from BambooHR
   * @returns Array of training records
   */
  async getTrainings(): Promise<any[]> {
    try {
      console.log("Fetching trainings from BambooHR");
      
      // Try to get trainings from training catalog
      const trainings = await this.fetchFromBamboo('/training/catalog');
      
      if (!trainings || !Array.isArray(trainings)) {
        console.warn("Invalid trainings response:", trainings);
        return [];
      }
      
      console.log(`Found ${trainings.length} trainings in catalog`);
      return trainings;
    } catch (error) {
      console.error("Error fetching trainings:", error);
      return [];
    }
  }
  
  /**
   * Get trainings for a specific employee
   * @param employeeId Employee ID
   * @param timeoutMs Timeout in milliseconds
   * @returns Array of training records for the employee
   */
  async getUserTrainings(employeeId: string, timeoutMs: number = 5000): Promise<any[]> {
    try {
      console.log(`Fetching trainings for employee ID: ${employeeId}`);
      
      // Try to get trainings from training/record/employee first
      try {
        const trainings = await this.fetchWithTimeout(
          `/training/record/employee/${employeeId}`, 
          {}, 
          timeoutMs
        );
        
        if (trainings && Array.isArray(trainings)) {
          console.log(`Found ${trainings.length} training records for employee ${employeeId}`);
          return trainings;
        } else {
          console.log("Training records endpoint returned invalid data, trying alternative");
        }
      } catch (trainingError) {
        console.warn(`Error fetching employee training records: ${trainingError.message}, trying alternatives`);
      }
      
      // Try to get trainings from tables/trainingCompleted
      try {
        const completedTrainings = await this.fetchWithTimeout(
          `/employees/${employeeId}/tables/trainingCompleted`,
          {},
          timeoutMs
        );
        
        if (completedTrainings && Array.isArray(completedTrainings)) {
          console.log(`Found ${completedTrainings.length} completed trainings for employee ${employeeId}`);
          return completedTrainings;
        } else {
          console.log("Training completed table returned invalid data, trying next alternative");
        }
      } catch (completedError) {
        console.warn(`Error fetching employee completed trainings: ${completedError.message}, trying last alternative`);
      }
      
      // Try certifications table as last resort
      try {
        const certifications = await this.fetchWithTimeout(
          `/employees/${employeeId}/tables/certifications`,
          {},
          timeoutMs
        );
        
        if (certifications && Array.isArray(certifications)) {
          console.log(`Found ${certifications.length} certifications for employee ${employeeId}`);
          return certifications;
        } else {
          console.log("Certifications table returned invalid data");
        }
      } catch (certError) {
        console.warn(`Error fetching employee certifications: ${certError.message}`);
      }
      
      console.info(`No training records found for employee ${employeeId}`);
      return [];
    } catch (error) {
      console.error(`Error in getUserTrainings for employee ${employeeId}:`, error);
      return [];
    }
  }
  
  /**
   * Fetch with timeout
   * @param endpoint BambooHR API endpoint
   * @param options Fetch options
   * @param timeoutMs Timeout in milliseconds
   * @returns Response data
   */
  private async fetchWithTimeout(endpoint: string, options: RequestInit = {}, timeoutMs: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request to ${endpoint} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      
      this.fetchFromBamboo(endpoint, options)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
}

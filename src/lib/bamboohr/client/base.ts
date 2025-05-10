
import { BambooApiOptions, BambooHRClientInterface, EdgeFunctionSecretsResult } from './types';

/**
 * Base BambooHRClient provides the low-level API communication with BambooHR.
 * It handles authentication, request formatting, and error handling.
 */
export class BambooHRClient implements BambooHRClientInterface {
  protected subdomain: string;
  protected apiKey: string;
  protected useEdgeFunction: boolean;
  protected edgeFunctionUrl: string;
  private defaultTimeout = 10000; // 10 seconds default timeout

  constructor(options: BambooApiOptions) {
    this.subdomain = options.subdomain || '';
    this.apiKey = options.apiKey || '';
    this.useEdgeFunction = options.useEdgeFunction || false;
    this.edgeFunctionUrl = options.edgeFunctionUrl || '';
    
    console.log(`BambooHR Client initialized - Using Edge Function: ${this.useEdgeFunction}`);
  }

  /**
   * Test if a BambooHR API endpoint exists and is accessible
   */
  async testEndpointExists(path: string): Promise<boolean> {
    try {
      const response = await this.fetchRawResponse(path);
      return response.ok;
    } catch (error) {
      console.error(`Error testing endpoint ${path}:`, error);
      return false;
    }
  }

  /**
   * Test connection to BambooHR
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to access the directory endpoint as a simple connection test
      const response = await this.fetchRawResponse('/employees/directory');
      return response.ok;
    } catch (error) {
      console.error('Error testing BambooHR connection:', error);
      return false;
    }
  }

  /**
   * Get raw response from BambooHR API for diagnostic purposes
   */
  async fetchRawResponse(path: string): Promise<Response> {
    const url = this.buildApiUrl(path);
    
    try {
      if (this.useEdgeFunction) {
        // Use Edge Function
        return this.fetchFromEdgeFunction(path);
      } else {
        // Direct API access (requires CORS proxy for browser usage)
        const headers = this.getAuthHeaders();
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
          credentials: 'omit'
        });
        
        return response;
      }
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetch data from BambooHR API
   * @param path API path to fetch from
   * @returns Parsed JSON response
   */
  async fetchFromBamboo(path: string): Promise<any> {
    const response = await this.fetchRawResponse(path);
    
    if (!response.ok) {
      // Get error details from response
      let errorDetail;
      try {
        // Try to get error in JSON format
        errorDetail = await response.json();
      } catch (e) {
        // If not JSON, get as text
        try {
          errorDetail = await response.text();
        } catch (e2) {
          errorDetail = 'Unknown error';
        }
      }
      
      throw new Error(`BambooHR API error (${response.status}): ${JSON.stringify(errorDetail)}`);
    }
    
    // Check if response is empty
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Not a JSON response
      const text = await response.text();
      
      if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
        throw new Error('Received HTML instead of JSON. This usually means authentication failed or incorrect subdomain.');
      }
      
      if (!text.trim()) {
        // Empty response
        return null;
      }
      
      // Try to parse as JSON anyway
      try {
        return JSON.parse(text);
      } catch (e) {
        // Not JSON, return as is
        console.warn('Response is not JSON:', text.substring(0, 100));
        return text;
      }
    }
    
    return await response.json();
  }

  /**
   * Fetch employees from BambooHR
   */
  async getEmployees(): Promise<any[]> {
    try {
      console.log('Fetching employees directory from BambooHR...');
      // First try employees directory endpoint (more complete data)
      const directoryResponse = await this.fetchFromBamboo('/employees/directory');
      
      if (directoryResponse && directoryResponse.employees && Array.isArray(directoryResponse.employees)) {
        console.log(`Found ${directoryResponse.employees.length} employees in directory`);
        return directoryResponse.employees;
      } else {
        // Fallback to basic employees endpoint
        console.log('Directory endpoint returned no data, trying basic employees endpoint...');
        const response = await this.fetchFromBamboo('/employees');
        
        if (Array.isArray(response)) {
          console.log(`Found ${response.length} employees from basic endpoint`);
          return response;
        }
        
        // If we still don't have employees, check if we got an employees object
        if (response && response.employees) {
          console.log(`Found ${response.employees.length} employees in response object`);
          return response.employees;
        }
        
        console.warn('No employees found in response:', response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }
  
  /**
   * Fetch trainings from BambooHR
   */
  async getTrainings(): Promise<any[]> {
    try {
      // First try to fetch from the training table
      console.log('Fetching trainings from training table...');
      try {
        const trainingTable = await this.fetchFromBamboo('/employees/all/tables/training');
        if (Array.isArray(trainingTable)) {
          console.log(`Found ${trainingTable.length} training types in training table`);
          return trainingTable;
        }
      } catch (error) {
        console.warn('Failed to fetch from training table:', error);
      }
      
      // Try to fetch from meta/fields for training types
      console.log('Fetching trainings from meta fields...');
      const fields = await this.fetchFromBamboo('/meta/fields');
      
      if (!Array.isArray(fields)) {
        console.warn('Fields response is not an array:', fields);
        return [];
      }
      
      // Filter fields that look like training types
      const trainingFields = fields.filter(field => {
        return field.name && (
          field.name.includes('Training') || 
          field.name.includes('Certification') || 
          field.name.includes('Course')
        );
      });
      
      console.log(`Found ${trainingFields.length} training field types`);
      return trainingFields;
    } catch (error) {
      console.error('Error fetching trainings:', error);
      throw error;
    }
  }

  /**
   * Fetch trainings for a specific employee
   */
  async getUserTrainings(employeeId: string, timeoutMs = 10000): Promise<any[]> {
    if (!employeeId) {
      console.error('No employee ID provided for getUserTrainings');
      return [];
    }
    
    try {
      console.log(`Fetching user trainings for employee ${employeeId}`);
      
      // Try different approaches with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        // First try the trainingCompleted table
        const trainingCompletedTable = await this.fetchFromBamboo(`/employees/${employeeId}/tables/trainingCompleted`);
        clearTimeout(timeoutId);
        
        if (Array.isArray(trainingCompletedTable) && trainingCompletedTable.length > 0) {
          console.log(`Found ${trainingCompletedTable.length} completed trainings in trainingCompleted table`);
          return trainingCompletedTable;
        }
      } catch (error) {
        console.warn(`Failed to fetch trainingCompleted for employee ${employeeId}:`, error);
      }
      
      // Try another approach - certifications table
      try {
        const certificationsTable = await this.fetchFromBamboo(`/employees/${employeeId}/tables/certifications`);
        
        if (Array.isArray(certificationsTable) && certificationsTable.length > 0) {
          console.log(`Found ${certificationsTable.length} certifications`);
          return certificationsTable;
        }
      } catch (error) {
        console.warn(`Failed to fetch certifications for employee ${employeeId}:`, error);
      }
      
      console.log(`No training records found for employee ${employeeId}`);
      return [];
    } catch (error) {
      console.error(`Error fetching user trainings for employee ${employeeId}:`, error);
      return [];
    }
  }

  /**
   * Check Edge Function secrets configuration
   */
  async checkEdgeFunctionSecrets(): Promise<EdgeFunctionSecretsResult> {
    if (!this.useEdgeFunction) {
      return {
        success: false,
        message: 'Edge Function is not enabled',
        secretsConfigured: false,
        secrets: {
          BAMBOOHR_SUBDOMAIN: false,
          BAMBOOHR_API_KEY: false
        }
      };
    }
    
    try {
      const url = `${this.edgeFunctionUrl}/check`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Edge Function check failed: HTTP ${response.status}`);
      }
      
      const result = await response.json();
      return result as EdgeFunctionSecretsResult;
    } catch (error) {
      console.error('Error checking Edge Function secrets:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        secretsConfigured: false,
        secrets: {
          BAMBOOHR_SUBDOMAIN: false,
          BAMBOOHR_API_KEY: false
        }
      };
    }
  }

  // Helper methods

  /**
   * Build API URL for BambooHR
   */
  protected buildApiUrl(path: string): string {
    if (this.useEdgeFunction) {
      // Use Edge Function
      // Remove leading slash from path
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      return `${this.edgeFunctionUrl}/${cleanPath}`;
    } else {
      // Direct API access (requires CORS proxy for browser usage)
      const cleanedSubdomain = this.subdomain.replace(/\.bamboohr\.com$/i, '');
      return `https://api.bamboohr.com/api/gateway.php/${cleanedSubdomain}/v1${path}`;
    }
  }

  /**
   * Get authentication headers for BambooHR API
   */
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    
    if (!this.useEdgeFunction && this.apiKey) {
      // Only add Basic Auth when not using Edge Function
      const authString = `${this.apiKey}:x`;
      headers['Authorization'] = `Basic ${btoa(authString)}`;
    }
    
    return headers;
  }

  /**
   * Fetch from Edge Function
   */
  private async fetchFromEdgeFunction(path: string): Promise<Response> {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const url = `${this.edgeFunctionUrl}/${cleanPath}`;
    
    // Add subdomain as query param
    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = `${url}${separator}subdomain=${this.subdomain}`;
    
    return fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
  }
}

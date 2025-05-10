
import { BaseBambooClient } from './base-client';

/**
 * Handles API data fetching with improved error handling and retry logic
 */
export class ApiFetcher extends BaseBambooClient {
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
   * Fetch with timeout
   * @param endpoint BambooHR API endpoint
   * @param options Fetch options
   * @param timeoutMs Timeout in milliseconds
   * @returns Response data
   */
  protected async fetchWithTimeout(endpoint: string, options: RequestInit = {}, timeoutMs: number): Promise<any> {
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

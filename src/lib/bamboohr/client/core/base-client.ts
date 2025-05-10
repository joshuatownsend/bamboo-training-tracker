
import { BambooApiOptions, BambooHRClientInterface, EdgeFunctionSecretsResult } from '../types';

/**
 * Base BambooHR API client class
 * Core functionality for BambooHR API communication
 */
export class BaseBambooClient {
  protected subdomain: string;
  protected apiKey: string;
  protected baseUrl: string;
  protected useEdgeFunction: boolean;
  protected edgeFunctionUrl: string;
  protected retryCount: number = 2;

  constructor(options: BambooApiOptions) {
    this.subdomain = options.subdomain || '';
    this.apiKey = options.apiKey || '';
    this.useEdgeFunction = options.useEdgeFunction || false;
    this.edgeFunctionUrl = options.edgeFunctionUrl || '/api/bamboohr';
    
    // Set up the base URL for BambooHR API
    this.baseUrl = `https://api.bamboohr.com/api/gateway.php/${this.subdomain}/v1`;
  }
  
  /**
   * Fetch raw response from BambooHR API
   * @param endpoint API endpoint to fetch
   * @param options Fetch options
   * @returns Raw Response object
   */
  async fetchRawResponse(endpoint: string, options: RequestInit = {}): Promise<Response> {
    if (this.useEdgeFunction) {
      // Edge function proxy request
      const url = `${this.edgeFunctionUrl}${endpoint}?subdomain=${this.subdomain}`;
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Accept': 'application/json',
        }
      });
    } else {
      // Direct API call
      const url = `${this.baseUrl}${endpoint}`;
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Accept': 'application/json',
          'Authorization': `Basic ${btoa(`${this.apiKey}:x`)}`
        }
      });
    }
  }
  
  /**
   * Check if BambooHR secrets are configured in Edge Function
   * @returns Information about configured secrets
   */
  async checkEdgeFunctionSecrets(): Promise<EdgeFunctionSecretsResult> {
    if (!this.useEdgeFunction) {
      return {
        success: false,
        message: "Edge Function is not enabled in config",
        secrets: {
          BAMBOOHR_SUBDOMAIN: false,
          BAMBOOHR_API_KEY: false
        }
      };
    }
    
    try {
      const url = `${this.edgeFunctionUrl}/check`;
      console.log(`Checking Edge Function secrets at ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge Function secret check failed: ${response.status} ${errorText}`);
      }
      
      const result: EdgeFunctionSecretsResult = await response.json();
      console.log("Edge Function secrets check result:", result);
      
      return result;
    } catch (error) {
      console.error("Failed to check Edge Function secrets:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        secrets: {
          BAMBOOHR_SUBDOMAIN: false,
          BAMBOOHR_API_KEY: false
        }
      };
    }
  }
}

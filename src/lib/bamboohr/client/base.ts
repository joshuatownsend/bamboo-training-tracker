
import { BambooApiOptions, EdgeFunctionSecretsResult } from './types';

/**
 * Base BambooHRClient provides the low-level API communication with BambooHR.
 * It handles authentication, request formatting, and error handling.
 */
export class BambooHRClient {
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

  // Return the raw response for advanced parsing with timeout handling
  async fetchRawResponse(endpoint: string, method = 'GET', body?: any, timeoutMs = this.defaultTimeout): Promise<Response> {
    const headers = new Headers();
    
    let url: string;
    
    // Use the Edge Function 
    if (this.useEdgeFunction) {
      url = `${this.edgeFunctionUrl}${endpoint}`;
      console.log(`Using Edge Function URL: ${url}`);
      
      // ALWAYS add subdomain as a query param for diagnostic purposes
      if (!url.includes('?')) {
        url += `?subdomain=${encodeURIComponent(this.subdomain || 'avfrd')}`;
      } else {
        url += `&subdomain=${encodeURIComponent(this.subdomain || 'avfrd')}`;
      }
      
      // When using Edge Function, we add an auth check header
      // The Edge Function will use its own credentials from environment variables
      headers.append("X-Client-Auth-Check", "true");
      
      // Add X-BambooHR-Auth header with the API key for the Edge Function to use
      // This helps with debugging and lets the edge function know we're authorized
      if (this.apiKey) {
        headers.append("X-BambooHR-Auth", "present");
      }
    } else {
      // Direct API access (legacy approach, will likely fail in browser due to CORS)
      url = `https://api.bamboohr.com/api/gateway.php/${this.subdomain}/v1${endpoint}`;
      // Base64 encode API key with empty password as per BambooHR docs
      const authHeader = "Basic " + btoa(`${this.apiKey}:`);
      headers.append("Authorization", authHeader);
    }
    
    headers.append("Accept", "application/json");
    
    // If we're doing a POST or PUT, add content type
    if (["POST", "PUT", "PATCH"].includes(method)) {
      headers.append("Content-Type", "application/json");
    }

    // Print full URL for debugging (removing API key for security)
    console.log(`BambooHR API request: ${method} ${url}`);
    
    try {
      console.log(`Sending request to BambooHR API: ${method} ${url}`);
      console.log(`Headers: ${JSON.stringify([...headers.entries()].map(([key, value]) => 
        key.toLowerCase() === 'authorization' ? [key, '[REDACTED]'] : [key, value]
      ))}`);
      
      // Create a timeout promise to race against the fetch
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
      });
      
      // Create the fetch promise
      const fetchPromise = fetch(url, {
        method,
        headers,
        body: ["GET", "HEAD", "OPTIONS"].includes(method) ? undefined : JSON.stringify(body),
        credentials: 'omit', // Don't send cookies
      });
      
      // Race the fetch against the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log(`Response status: ${response.status}`);
      
      return response;
    } catch (error) {
      console.error(`Error in BambooHR API call to ${endpoint}:`, error);
      throw error;
    }
  }

  // Method to check if edge function secrets are configured
  async checkEdgeFunctionSecrets(): Promise<EdgeFunctionSecretsResult> {
    if (!this.useEdgeFunction) {
      return { secretsConfigured: false, error: "Not using Edge Function" };
    }

    try {
      const response = await this.fetchRawResponse('/check-secrets');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error checking Edge Function secrets:', errorText);
        return { secretsConfigured: false, error: errorText };
      }
      
      const data = await response.json();
      console.log('Check secrets response data:', data);
      return { 
        secretsConfigured: data.secrets.BAMBOOHR_SUBDOMAIN && data.secrets.BAMBOOHR_API_KEY,
        secrets: data.secrets,
        environmentKeys: data.environmentKeys || []
      };
    } catch (error) {
      console.error('Error checking Edge Function secrets:', error);
      return { 
        secretsConfigured: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Test if API endpoint exists without parsing the response
  async testEndpointExists(endpoint: string): Promise<boolean> {
    try {
      const response = await this.fetchRawResponse(endpoint);
      // Any response (even error responses) means the endpoint exists in some form
      // We'll interpret a 401 or 403 as "endpoint exists but not authorized"
      return response.status !== 404;
    } catch (error) {
      console.error(`Error checking endpoint ${endpoint}:`, error);
      return false;
    }
  }
  
  // Add minimal implementation for fetchAllData to satisfy service usage
  async fetchAllData(isConnectionTest = false): Promise<any> {
    // Minimal implementation
    return {};
  }
}

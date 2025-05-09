/**
 * BambooHRClient provides the low-level API communication with BambooHR.
 * It handles authentication, request formatting, and error handling.
 */
export interface BambooApiOptions {
  subdomain: string;
  apiKey: string;
  useEdgeFunction?: boolean;
  edgeFunctionUrl?: string;
}

export class BambooHRClient {
  private subdomain: string;
  private apiKey: string;
  private useEdgeFunction: boolean;
  private edgeFunctionUrl: string;

  constructor(options: BambooApiOptions) {
    this.subdomain = options.subdomain;
    this.apiKey = options.apiKey;
    this.useEdgeFunction = options.useEdgeFunction || false;
    this.edgeFunctionUrl = options.edgeFunctionUrl || '';
  }

  // Return the raw response for advanced parsing
  async fetchRawResponse(endpoint: string, method = 'GET', body?: any) {
    const headers = new Headers();
    
    let url: string;
    
    if (this.useEdgeFunction) {
      // Use our Edge Function - ensure we have the full path
      url = `${this.edgeFunctionUrl}${endpoint}`;
      console.log(`Using Edge Function URL: ${url}`);
      // No auth headers needed for Edge Function - it uses environment variables
    } else {
      // Direct API access (legacy approach, will likely fail in browser due to CORS)
      url = `https://api.bamboohr.com/api/gateway.php/${this.subdomain}/v1${endpoint}`;
      // Base64 encode API key with empty username as per BambooHR docs
      const authHeader = "Basic " + btoa(`${this.apiKey}:`);
      headers.append("Authorization", authHeader);
    }
    
    headers.append("Accept", "application/json");
    
    if (method !== 'GET' && body) {
      headers.append("Content-Type", "application/json");
    }

    // Print full URL for debugging (removing API key for security)
    console.log(`BambooHR API request: ${method} ${url}`);
    console.log(`Using Edge Function: ${this.useEdgeFunction}`);
    
    try {
      console.log(`Sending request to BambooHR API: ${method} ${url}`);
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'omit', // Don't send cookies
      });
      
      return response;
    } catch (error) {
      console.error(`Error in BambooHR API call to ${endpoint}:`, error);
      throw error;
    }
  }

  async fetchFromBamboo(endpoint: string, method = 'GET', body?: any) {
    try {
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
          
          throw new Error(`BambooHR authentication failed. Edge Function returned HTML instead of JSON data.`);
        }
        
        // Try to parse as JSON if it might be JSON
        try {
          const errorJson = JSON.parse(responseText);
          throw new Error(`BambooHR API error (${response.status}): ${errorJson.error || JSON.stringify(errorJson)}`);
        } catch (parseError) {
          // If not parseable as JSON, return the text directly
          throw new Error(`BambooHR API error (${response.status}): ${responseText || 'Unknown error'}`);
        }
      }

      // Try to parse the response as JSON
      const responseText = await response.text();
      try {
        return JSON.parse(responseText);
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

  // Test if API endpoint exists without parsing the response
  async testEndpointExists(endpoint: string): Promise<boolean> {
    const headers = new Headers();
    
    let url: string;
    
    if (this.useEdgeFunction) {
      url = `${this.edgeFunctionUrl}/bamboohr${endpoint}`;
    } else {
      url = `https://api.bamboohr.com/api/gateway.php/${this.subdomain}/v1${endpoint}`;
      const authHeader = "Basic " + btoa(`${this.apiKey}:`);
      headers.append("Authorization", authHeader);
    }
    
    headers.append("Accept", "application/json");
    
    console.log(`Testing endpoint existence: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',  // Use HEAD to just check if resource exists
        headers,
        credentials: 'omit',
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Error checking endpoint ${endpoint}:`, error);
      return false;
    }
  }
}

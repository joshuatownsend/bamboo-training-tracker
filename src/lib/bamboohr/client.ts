
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
    this.subdomain = options.subdomain || '';
    this.apiKey = options.apiKey || '';
    this.useEdgeFunction = options.useEdgeFunction || false;
    this.edgeFunctionUrl = options.edgeFunctionUrl || '';
    
    console.log(`BambooHR Client initialized - Using Edge Function: ${this.useEdgeFunction}`);
  }

  // Return the raw response for advanced parsing
  async fetchRawResponse(endpoint: string, method = 'GET', body?: any) {
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
      
      const response = await fetch(url, {
        method,
        headers,
        body: ["GET", "HEAD", "OPTIONS"].includes(method) ? undefined : JSON.stringify(body),
        credentials: 'omit', // Don't send cookies
      });
      
      console.log(`Response status: ${response.status}`);
      
      return response;
    } catch (error) {
      console.error(`Error in BambooHR API call to ${endpoint}:`, error);
      throw error;
    }
  }

  // Method to check if edge function secrets are configured
  async checkEdgeFunctionSecrets() {
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
          
          throw new Error(`BambooHR authentication failed. ${this.useEdgeFunction ? 'Edge Function' : 'Server'} returned HTML instead of JSON data.`);
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
}

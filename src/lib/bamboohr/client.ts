
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
    
    // Use the Edge Function 
    if (this.useEdgeFunction) {
      url = `${this.edgeFunctionUrl}${endpoint}`;
      console.log(`Using Edge Function URL: ${url}`);
      
      // ALWAYS add subdomain as a query param for diagnostic purposes
      // This ensures the Edge Function knows which subdomain we're trying to use
      // even though it will likely use the server-configured subdomain
      if (!url.includes('?')) {
        url += `?subdomain=${encodeURIComponent(this.subdomain || 'avfrd')}`;
      } else {
        url += `&subdomain=${encodeURIComponent(this.subdomain || 'avfrd')}`;
      }
      
      console.log(`Final Edge Function URL with params: ${url}`);
      // No auth headers needed for Edge Function - it uses environment variables
    } else {
      // Direct API access (legacy approach, will likely fail in browser due to CORS)
      url = `https://api.bamboohr.com/api/gateway.php/${this.subdomain}/v1${endpoint}`;
      // Base64 encode API key with empty username as per BambooHR docs
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
    console.log(`Using Edge Function: ${this.useEdgeFunction}`);
    console.log(`Using Subdomain: ${this.subdomain}`);
    
    try {
      console.log(`Sending request to BambooHR API: ${method} ${url}`);
      
      const response = await fetch(url, {
        method,
        headers,
        body: ["GET", "HEAD", "OPTIONS"].includes(method) ? undefined : JSON.stringify(body),
        credentials: 'omit', // Don't send cookies
      });
      
      console.log(`Response status: ${response.status}`);
      console.log(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
      
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
          
          throw new Error(`BambooHR authentication failed. ${this.useEdgeFunction ? 'Edge Function' : 'Server'} returned HTML instead of JSON data.`);
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

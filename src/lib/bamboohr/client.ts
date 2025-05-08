
/**
 * BambooHRClient provides the low-level API communication with BambooHR.
 * It handles authentication, request formatting, and error handling.
 */
export class BambooHRClient {
  private apiKey: string;
  private subdomain: string;
  private useProxy: boolean;

  constructor(options: { 
    subdomain: string; 
    apiKey: string; 
    useProxy?: boolean;
  }) {
    this.apiKey = options.apiKey;
    this.subdomain = options.subdomain;
    this.useProxy = options.useProxy ?? true; // Default to using the proxy
  }

  // Return the raw response for advanced parsing
  async fetchRawResponse(endpoint: string, method = 'GET', body?: any) {
    const headers = new Headers();
    
    let url: string;
    
    if (this.useProxy) {
      // Use our proxy endpoint
      url = `/api/bamboohr/api/gateway.php/${this.subdomain}/v1${endpoint}`;
      // Add auth header that the server will forward
      headers.append("X-BambooHR-ApiKey", this.apiKey);
    } else {
      // Direct API access (will fail in browser due to CORS)
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
    console.log(`Using proxy: ${this.useProxy}`);
    console.log(`Subdomain: ${this.subdomain}`);
    
    // Log headers (redacting sensitive info)
    const headerObj: Record<string, string> = {};
    headers.forEach((value, key) => {
      headerObj[key] = key === 'Authorization' || key === 'X-BambooHR-ApiKey' ? '[REDACTED]' : value;
    });
    console.log('Request headers:', headerObj);
    
    try {
      console.log(`Sending request to BambooHR API: ${method} ${url}`);
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        // Explicitly set credentials mode based on proxy usage
        credentials: this.useProxy ? 'same-origin' : 'omit',
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
          
          // Look for specific patterns in the HTML to provide better diagnostics
          if (responseText.includes('login') || responseText.includes('<!DOCTYPE')) {
            // Extract the page title which might contain useful error info
            const titleMatch = responseText.match(/<title>(.*?)<\/title>/);
            const title = titleMatch ? titleMatch[1] : 'Login page';
            
            throw new Error(`BambooHR returned a ${title} page instead of JSON data. This typically indicates: 
            1. Incorrect subdomain - "${this.subdomain}" might not be valid 
            2. Invalid API key - Please verify your API key is current
            3. Authentication issues - Your API key may not have sufficient permissions
            4. API endpoint format - The endpoint "${endpoint}" may not be correctly formatted`);
          } else {
            throw new Error(`BambooHR API returned HTML instead of JSON. This usually indicates authentication issues or incorrect subdomain.`);
          }
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
          throw new Error(`BambooHR returned an HTML page instead of JSON. This suggests the subdomain "${this.subdomain}" is incorrect or your API key is invalid. Please verify both in the BambooHR settings.`);
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
    
    if (this.useProxy) {
      url = `/api/bamboohr/api/gateway.php/${this.subdomain}/v1${endpoint}`;
      headers.append("X-BambooHR-ApiKey", this.apiKey);
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
        credentials: this.useProxy ? 'same-origin' : 'omit',
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Error checking endpoint ${endpoint}:`, error);
      return false;
    }
  }
}

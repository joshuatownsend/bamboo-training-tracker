
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

  async fetchFromBamboo(endpoint: string, method = 'GET', body?: any) {
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

    console.log(`BambooHR API request: ${method} ${url}`);
    
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
      });

      if (!response.ok) {
        // Check if the response is HTML (common when getting redirected to a login page)
        const contentType = response.headers.get('content-type');
        const responseText = await response.text();
        
        if (contentType && contentType.includes('text/html')) {
          console.error('Received HTML response instead of JSON:', responseText.substring(0, 200) + '...');
          
          // More specific error message for HTML responses
          if (responseText.includes('login') || responseText.includes('<!DOCTYPE')) {
            throw new Error(`BambooHR API returned a login page instead of JSON data. This typically means either your subdomain "${this.subdomain}" is incorrect or your API key is invalid/expired.`);
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
        throw new Error(`Invalid JSON response from BambooHR API: ${(parseError as Error).message}`);
      }
    } catch (error) {
      console.error(`Error in BambooHR API call to ${endpoint}:`, error);
      throw error;
    }
  }
}

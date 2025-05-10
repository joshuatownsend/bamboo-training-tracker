
import { corsHeaders, getBambooCredentials, logWithTimestamp, cleanSecret } from "./utils.ts";

/**
 * Handle BambooHR API request
 * @param req Original request
 * @param path Path to forward to BambooHR
 * @param params URL search parameters
 * @returns Response from BambooHR
 */
export async function handleBambooHRRequest(req: Request, path: string, params: URLSearchParams): Promise<Response> {
  // Get credentials from request or environment
  const { subdomain, apiKey, hasCredentials } = getBambooCredentials(params);
  
  if (!hasCredentials) {
    return new Response(
      JSON.stringify({
        error: "Configuration error",
        message: "BambooHR credentials not provided in request or environment variables",
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
  
  // Detect requests that typically take longer and use extended timeout
  const slowEndpoints = ['training/record', 'tables/trainingCompleted', 'tables/certifications'];
  const isSlowEndpoint = slowEndpoints.some(endpoint => path.includes(endpoint));
  const timeoutMs = isSlowEndpoint ? 60000 : 30000; // 60 seconds for slow endpoints, 30 for others
  
  if (isSlowEndpoint) {
    logWithTimestamp(`Detected request for endpoint that may be slow, using extended timeout of ${timeoutMs}ms`);
  }
  
  // Clean and log the subdomain
  logWithTimestamp(`Using subdomain: "${subdomain}", raw length: ${subdomain.length}, cleaned length: ${cleanSecret(subdomain).length}`);
  
  // Build the request URL for BambooHR
  const url = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1${path}?subdomain=${subdomain}`;
  logWithTimestamp(`Forwarding request to: ${url}`);
  
  // Forward the headers (except host & origin)
  const headers: {[key: string]: string} = {
    'Accept': 'application/json',
    'Authorization': `Basic ${btoa(`${apiKey}:x`)}` 
  };
  
  // Log headers (without auth)
  logWithTimestamp(`Headers: ${JSON.stringify(Array.from(req.headers.entries())
    .filter(([key]) => !['authorization', 'host', 'origin'].includes(key.toLowerCase())))}`);
  
  // Forward the request with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Check content type to determine how to handle the response
    const contentType = response.headers.get('content-type') || '';
    
    // For error responses, try to get more details
    if (!response.ok) {
      let errorBody: string | object;
      
      try {
        if (contentType.includes('application/json')) {
          errorBody = await response.json();
        } else {
          errorBody = await response.text();
        }
      } catch (e) {
        errorBody = "Could not parse error response";
      }
      
      logWithTimestamp(`BambooHR API error: HTTP ${response.status}, Body: ${typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody)}`);
      
      // Special handling for 404 errors from tables endpoints
      if (response.status === 404 && (path.includes('/tables/trainingCompleted') || path.includes('/tables/certifications'))) {
        // Try fallback to 'training/record/employee' endpoint for this employee
        const employeeIdMatch = path.match(/\/employees\/(\d+)\/tables\//);
        if (employeeIdMatch && employeeIdMatch[1]) {
          const employeeId = employeeIdMatch[1];
          logWithTimestamp(`404 for tables endpoint, suggesting fallback to training/record/employee/${employeeId}`);
          
          return new Response(
            JSON.stringify({
              error: `BambooHR API Error (HTTP ${response.status})`,
              message: errorBody,
              fallbackEndpoint: `/training/record/employee/${employeeId}`,
              timestamp: new Date().toISOString()
            }),
            {
              status: response.status,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }
      
      return new Response(
        JSON.stringify({
          error: `BambooHR API Error (HTTP ${response.status})`,
          message: errorBody,
          timestamp: new Date().toISOString()
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // For successful responses
    if (contentType.includes('application/json')) {
      const data = await response.text();
      logWithTimestamp(`BambooHR API response (JSON): ${data.length > 200 ? data.substring(0, 200) + '...' : data}`);
      
      return new Response(data, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else {
      const text = await response.text();
      logWithTimestamp(`BambooHR API response (${contentType}): [${text.length} bytes]`);
      
      return new Response(text, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType
        }
      });
    }
    
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    logWithTimestamp(`Error forwarding request: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        error: isTimeout ? "Request timeout" : "Request failed",
        message: error.message,
        timeout: isTimeout,
        timestamp: new Date().toISOString()
      }),
      {
        status: isTimeout ? 504 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

/**
 * Handle secrets check request
 * @param req Original request
 * @returns Response with secrets check result
 */
export async function handleSecretsCheck(req: Request): Promise<Response> {
  try {
    logWithTimestamp("Checking for BambooHR secrets in environment");
    
    // Try to get secrets with different casing variations
    const subdomain = cleanSecret(Deno.env.get('BAMBOOHR_SUBDOMAIN'));
    const subdomainLower = cleanSecret(Deno.env.get('bamboohr_subdomain'));
    const subdomainUpper = cleanSecret(Deno.env.get('BAMBOOHR_SUBDOMAIN')); // Same as first but explicit uppercase
    
    const apiKey = cleanSecret(Deno.env.get('BAMBOOHR_API_KEY'));
    const apiKeyLower = cleanSecret(Deno.env.get('bamboohr_api_key'));
    
    // Get all environment keys for debugging (without revealing values)
    const envKeys = Object.keys(Deno.env.toObject());
    
    // Construct the result
    const result = {
      success: true,
      message: "Secrets check completed",
      secretsConfigured: Boolean(subdomain && apiKey),
      secrets: {
        BAMBOOHR_SUBDOMAIN: Boolean(subdomain),
        BAMBOOHR_API_KEY: Boolean(apiKey),
        // Include alternative casings for debugging
        bamboohr_subdomain: Boolean(subdomainLower),
        BAMBOOHR_SUBDOMAIN_UPPER: Boolean(subdomainUpper),
        bamboohr_api_key: Boolean(apiKeyLower)
      },
      environmentKeys: envKeys,
      timestamp: new Date().toISOString(),
      // Add a verification string to help with debugging
      deploymentVerification: "Edge Function is working"
    };
    
    logWithTimestamp(`Secrets check result: ${JSON.stringify({
      success: result.success,
      secretsConfigured: result.secretsConfigured,
      secrets: result.secrets,
      envKeysCount: envKeys.length
    })}`);
    
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    logWithTimestamp(`Error during secrets check: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error checking secrets: ${error.message}`,
        error: error.message,
        timestamp: new Date().toISOString(),
        secrets: {
          BAMBOOHR_SUBDOMAIN: false,
          BAMBOOHR_API_KEY: false
        }
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

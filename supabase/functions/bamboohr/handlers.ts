
import { corsHeaders, logWithTimestamp } from "./utils.ts";

// Function to check if required secrets are properly set
export async function handleSecretsCheck(req: Request) {
  const subdomain = Deno.env.get('BAMBOOHR_SUBDOMAIN');
  const apiKey = Deno.env.get('BAMBOOHR_API_KEY');
  
  return new Response(
    JSON.stringify({
      status: 'available',
      secrets: {
        BAMBOOHR_SUBDOMAIN: !!subdomain,
        BAMBOOHR_API_KEY: !!apiKey,
      },
      timestamp: new Date().toISOString()
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    }
  );
}

// Main handler for BambooHR API requests
export async function handleBambooHRRequest(req: Request, path: string, params: URLSearchParams) {
  try {
    // Get credentials from environment
    const subdomain = params.get('subdomain') || Deno.env.get('BAMBOOHR_SUBDOMAIN');
    const apiKey = Deno.env.get('BAMBOOHR_API_KEY');
    
    // Check if credentials are available
    if (!subdomain || !apiKey) {
      logWithTimestamp("Missing BambooHR credentials");
      return new Response(
        JSON.stringify({
          error: "Configuration error",
          message: "BambooHR credentials not properly configured",
          missingConfig: {
            subdomain: !subdomain,
            apiKey: !apiKey
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }
    
    // Fix: Fix the URL parameter handling to avoid double-encoding issues
    // Remove subdomain from params as we'll use it directly in the URL
    params.delete('subdomain');
    
    // Construct the BambooHR API URL
    // Important: Build query string manually instead of appending params to avoid encoding issues
    let bambooUrl = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1${path}`;
    
    // Add any remaining query parameters
    const queryParams: string[] = [];
    params.forEach((value, key) => {
      queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });
    
    if (queryParams.length > 0) {
      // If the path already contains a query parameter, append with &, otherwise use ?
      const separator = path.includes('?') ? '&' : '?';
      bambooUrl += separator + queryParams.join('&');
    }
    
    logWithTimestamp(`Forwarding request to BambooHR: ${req.method} ${bambooUrl}`);
    
    // Forward the request to BambooHR API with proper auth
    const bambooResponse = await fetch(bambooUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${btoa(apiKey + ':x')}`
      }
    });
    
    // Get the response content
    let responseBody;
    const contentType = bambooResponse.headers.get('content-type');
    
    if (bambooResponse.status === 404) {
      logWithTimestamp(`BambooHR returned 404 for URL: ${bambooUrl}`);
      return new Response(
        JSON.stringify({
          error: "Resource not found",
          message: "The requested BambooHR resource was not found",
          status: 404,
          url: bambooUrl
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404 
        }
      );
    }
    
    if (contentType && contentType.includes('application/json')) {
      responseBody = await bambooResponse.json();
    } else {
      responseBody = await bambooResponse.text();
    }
    
    logWithTimestamp(`BambooHR responded with status: ${bambooResponse.status}`);
    
    // Return the response from BambooHR
    return new Response(
      typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': contentType || 'application/json'
        }, 
        status: bambooResponse.status 
      }
    );
  } catch (error) {
    logWithTimestamp(`Error in BambooHR request: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        error: "Failed to process BambooHR request",
        message: error.message,
        path: path
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
}

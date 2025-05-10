
import { corsHeaders, logWithTimestamp } from "./utils.ts";

// Define the API request handler function
export async function handleBambooHRRequest(req: Request, path: string, searchParams: URLSearchParams) {
  // Check if we have the necessary credentials in the environment
  const subdomain = Deno.env.get("BAMBOOHR_SUBDOMAIN") || searchParams.get("subdomain") || "";
  const apiKey = Deno.env.get("BAMBOOHR_API_KEY");
  
  if (!subdomain || !apiKey) {
    logWithTimestamp(`Missing API credentials: subdomain=${subdomain ? "✓" : "✗"}, apiKey=${apiKey ? "✓" : "✗"}`);
    return new Response(
      JSON.stringify({ 
        error: "Missing BambooHR credentials in environment variables",
        details: "Please set BAMBOOHR_SUBDOMAIN and BAMBOOHR_API_KEY environment variables",
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }

  try {
    // Set up the request to BambooHR API
    const bambooUrl = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1${path}`;
    const authHeader = `Basic ${btoa(`${apiKey}:x`)}`;
    
    logWithTimestamp(`Forwarding request to BambooHR: ${req.method} ${bambooUrl}`);
    
    // Forward the request to BambooHR
    const response = await fetch(bambooUrl, {
      method: req.method,
      headers: {
        "Accept": "application/json",
        "Authorization": authHeader,
        // Optionally forward content-type if present
        ...(req.headers.get("Content-Type") 
          ? { "Content-Type": req.headers.get("Content-Type")! } 
          : {})
      },
      ...(req.method !== "GET" && req.method !== "HEAD" 
        ? { body: await req.text() } 
        : {})
    });
    
    // Forward the response back to the client
    const responseBody = await response.text();
    logWithTimestamp(`BambooHR responded with status: ${response.status}`);
    
    // For successful responses, just forward the response
    if (response.ok) {
      return new Response(responseBody, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": response.headers.get("Content-Type") || "application/json"
        }
      });
    } else {
      // For error responses, log the error and forward it
      logWithTimestamp(`BambooHR API error (${response.status}): ${responseBody}`);
      return new Response(responseBody, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": response.headers.get("Content-Type") || "application/json"
        }
      });
    }
  } catch (error) {
    // Handle any network or other errors
    logWithTimestamp(`Error in handleBambooHRRequest: ${error.message}`);
    return new Response(
      JSON.stringify({
        error: "Error forwarding request to BambooHR",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
}

// Handler for checking if required secrets are set in the edge function
export async function handleSecretsCheck(req: Request) {
  try {
    const subdomain = Deno.env.get("BAMBOOHR_SUBDOMAIN");
    const apiKey = Deno.env.get("BAMBOOHR_API_KEY");
    const subdomainLower = Deno.env.get("bamboohr_subdomain");
    const subdomainUpper = Deno.env.get("BAMBOOHR_SUBDOMAIN_UPPER");
    
    // Get all environment keys for debugging
    const envKeys = Object.keys(Deno.env.toObject());
    
    return new Response(
      JSON.stringify({
        success: true,
        secrets: {
          BAMBOOHR_SUBDOMAIN: !!subdomain,
          BAMBOOHR_API_KEY: !!apiKey,
          // Include alternate casing for debugging
          bamboohr_subdomain: !!subdomainLower,
          BAMBOOHR_SUBDOMAIN_UPPER: !!subdomainUpper
        },
        allSecretsConfigured: !!subdomain && !!apiKey,
        environmentKeys: envKeys,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    logWithTimestamp(`Error in handleSecretsCheck: ${error.message}`);
    return new Response(
      JSON.stringify({
        error: "Error checking secrets",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

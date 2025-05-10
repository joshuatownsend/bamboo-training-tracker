import { corsHeaders, cleanSecret, getBambooCredentials, logWithTimestamp, createErrorResponse } from "./utils.ts";

// Timeout for API requests to BambooHR - 5 seconds
export const BAMBOOHR_REQUEST_TIMEOUT = 5000;

// Handle secrets check endpoint
export async function handleSecretsCheck(req: Request): Promise<Response> {
  const timestamp = new Date().toISOString();
  logWithTimestamp(`Checking secrets configuration...`);
  
  // Check for existence of environment variables and log their exact names
  const allEnvKeys = Object.keys(Deno.env.toObject());
  logWithTimestamp(`All environment keys: ${JSON.stringify(allEnvKeys)}`);
  
  // Try different case variations of the subdomain secret
  // Clean each secret value to remove any whitespace/newlines
  const subdomainRaw = Deno.env.get("BAMBOOHR_SUBDOMAIN");
  const subdomain = cleanSecret(subdomainRaw);
  const subdomainLower = cleanSecret(Deno.env.get("bamboohr_subdomain"));
  const subdomainUpper = cleanSecret(Deno.env.get("BAMBOOHR_SUBDOMAIN"));
  const apiKey = Deno.env.get("BAMBOOHR_API_KEY");
  
  // Log the raw value to help with debugging
  logWithTimestamp(`Raw BAMBOOHR_SUBDOMAIN value: "${subdomainRaw}"`);
  logWithTimestamp(`Cleaned BAMBOOHR_SUBDOMAIN value: "${subdomain}"`);
  
  logWithTimestamp(`Secret check detailed results:`);
  logWithTimestamp(`- BAMBOOHR_SUBDOMAIN: ${!!subdomain} (value: ${subdomain ? `"${subdomain}"` : 'undefined'})`);
  logWithTimestamp(`- bamboohr_subdomain: ${!!subdomainLower} (value: ${subdomainLower ? `"${subdomainLower}"` : 'undefined'})`);
  logWithTimestamp(`- BAMBOOHR_SUBDOMAIN: ${!!subdomainUpper} (value: ${subdomainUpper ? `"${subdomainUpper}"` : 'undefined'})`);
  logWithTimestamp(`- BAMBOOHR_API_KEY: ${!!apiKey} (value: ${apiKey ? '[REDACTED]' : 'undefined'})`);
  
  return new Response(
    JSON.stringify({
      success: true,
      secrets: {
        BAMBOOHR_SUBDOMAIN: !!subdomain,
        bamboohr_subdomain: !!subdomainLower,
        BAMBOOHR_SUBDOMAIN_UPPER: !!subdomainUpper,
        BAMBOOHR_API_KEY: !!apiKey
      },
      environmentKeys: allEnvKeys,
      rawSubdomainLength: subdomainRaw ? subdomainRaw.length : 0,
      cleanedSubdomainLength: subdomain ? subdomain.length : 0,
      rawCharCodes: subdomainRaw ? Array.from(subdomainRaw).map(c => c.charCodeAt(0)) : [],
      timestamp: timestamp,
      deploymentVerification: "Debug function updated with whitespace cleaning and timeouts"
    }),
    { headers: corsHeaders, status: 200 }
  );
}

// Handle BambooHR API request
export async function handleBambooHRRequest(req: Request, path: string, searchParams: URLSearchParams): Promise<Response> {
  const { subdomain, apiKey, hasCredentials } = getBambooCredentials(searchParams);
  const timestamp = new Date().toISOString();
  
  logWithTimestamp(`Using subdomain: "${subdomain || '(not found)'}", raw length: ${subdomain.length}, cleaned length: ${subdomain.length}`);
  
  // Check for required credentials
  if (!hasCredentials) {
    logWithTimestamp(`Missing BambooHR credentials - BAMBOOHR_SUBDOMAIN: ${!!subdomain}, BAMBOOHR_API_KEY: ${!!apiKey}`);
    return createErrorResponse(500, "Missing BambooHR credentials in environment variables", {
      BAMBOOHR_SUBDOMAIN: !!subdomain,
      BAMBOOHR_API_KEY: !!apiKey
    });
  }
  
  // Check for requests to endpoints known to be slow
  // For individual employee training records, we should add a timeout
  if (path.includes('/training/record/employee/')) {
    logWithTimestamp(`Detected request for individual employee training records, adding timeout of ${BAMBOOHR_REQUEST_TIMEOUT}ms`);
  }
  
  // Build the target BambooHR URL
  const targetUrl = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1${path}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  
  // Construct headers for BambooHR API request
  const headers = new Headers();
  
  // Add Basic Authentication header for BambooHR
  const authHeader = "Basic " + btoa(`${apiKey}:`);
  headers.append("Authorization", authHeader);
  
  // Copy content-type if present
  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers.append("Content-Type", contentType);
  }
  
  // Copy accept header or default to JSON
  const accept = req.headers.get("accept") || "application/json";
  headers.append("Accept", accept);
  
  // Log request details (excluding sensitive info)
  logWithTimestamp(`Forwarding request to: ${targetUrl}`);
  logWithTimestamp(`Headers: ${JSON.stringify([...headers.entries()]
    .filter(([key]) => key.toLowerCase() !== "authorization")
    .map(([key, value]) => [key, value])
  )}`);
  
  return await makeProxyRequest(req, targetUrl, headers);
}

// Function to make the actual proxy request with timeout handling
async function makeProxyRequest(req: Request, targetUrl: string, headers: Headers): Promise<Response> {
  // Create an AbortController for timeout management
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    logWithTimestamp(`Request timed out after ${BAMBOOHR_REQUEST_TIMEOUT}ms`);
  }, BAMBOOHR_REQUEST_TIMEOUT);
  
  try {
    // Forward the request to BambooHR with timeout
    const bambooResponse = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: ["GET", "HEAD", "OPTIONS"].includes(req.method) ? undefined : await req.text(),
      signal: controller.signal
    });
    
    // Clear the timeout since we got a response
    clearTimeout(timeoutId);
    
    // Get response data
    let responseData;
    const responseContentType = bambooResponse.headers.get("content-type") || "";
    
    if (responseContentType.includes("application/json")) {
      responseData = await bambooResponse.text();
      // Log truncated response for debugging
      logWithTimestamp(`BambooHR API response (JSON): ${responseData.substring(0, 200)}...`);
    } else {
      responseData = await bambooResponse.text();
      logWithTimestamp(`BambooHR API response (${responseContentType}): [${responseData.length} bytes]`);
    }
    
    // Return the response with CORS headers
    return new Response(responseData, {
      status: bambooResponse.status,
      headers: {
        ...corsHeaders,
        "Content-Type": responseContentType
      }
    });
  } catch (fetchError) {
    // Clear the timeout since we got an error
    clearTimeout(timeoutId);
    
    // Check if this is an abort error (timeout)
    if (fetchError.name === 'AbortError') {
      logWithTimestamp(`Request timed out for ${targetUrl}`);
      return createErrorResponse(503, "BambooHR API request timed out");
    }
    
    // Handle other fetch errors
    const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
    logWithTimestamp(`Fetch error for ${targetUrl}: ${errorMessage}`);
    return createErrorResponse(503, "Error connecting to BambooHR API", { message: errorMessage });
  }
}

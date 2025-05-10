
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bamboohr-auth',
};

// BambooHR API timeout (30 seconds)
const API_TIMEOUT = 30000;

// Define common headers
const COMMON_HEADERS = {
  ...corsHeaders,
  'Content-Type': 'application/json'
};

// Define the serve handler function
serve(async (req) => {
  console.log(`BambooHR Edge Function received request: ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Check if this is a secrets check request
    if (new URL(req.url).pathname.endsWith('/check')) {
      return handleSecretsCheck(req);
    }
    
    // Get subdomain from query parameter or environment
    const url = new URL(req.url);
    const subdomain = getSubdomain(url);
    
    if (!subdomain) {
      return new Response(
        JSON.stringify({ error: "BambooHR subdomain is required" }),
        { headers: COMMON_HEADERS, status: 400 }
      );
    }
    
    console.log(`Using subdomain: "${subdomain}", raw length: ${subdomain.length}, cleaned length: ${subdomain.replace(/\.bamboohr\.com$/i, '').length}`);
    
    // Get API key from environment variable
    const apiKey = Deno.env.get('BAMBOOHR_API_KEY');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "BambooHR API key is not configured" }),
        { headers: COMMON_HEADERS, status: 500 }
      );
    }

    // Construct BambooHR API URL
    const cleanSubdomain = subdomain.replace(/\.bamboohr\.com$/i, '');
    const pathWithoutPrefix = url.pathname.replace(/^\/bamboohr\//, '');
    const query = url.search;
    const bambooUrl = `https://api.bamboohr.com/api/gateway.php/${cleanSubdomain}/v1/${pathWithoutPrefix}${query}`;
    
    console.log(`Forwarding request to: ${bambooUrl}`);

    // Get custom headers to forward
    const headers: Record<string, string> = {};
    
    // Only forward specific headers
    const forwardedHeaders = Array.from(req.headers.entries())
      .filter(([name]) => name.toLowerCase() !== 'host' && 
                           name.toLowerCase() !== 'authorization' &&
                           name.toLowerCase() !== 'origin' &&
                           name.toLowerCase() !== 'referer');
    
    console.log("Headers:", forwardedHeaders);
    
    forwardedHeaders.forEach(([name, value]) => {
      headers[name] = value;
    });

    // Always add accept header if not provided
    if (!headers['accept']) {
      headers['accept'] = 'application/json';
    }

    // Add basic auth header
    headers['Authorization'] = `Basic ${btoa(`${apiKey}:x`)}`;

    // Send request to BambooHR with timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), API_TIMEOUT);

    try {
      const response = await fetch(bambooUrl, {
        method: req.method,
        headers,
        body: req.body,
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      // Get content type to properly handle the response
      const contentType = response.headers.get('Content-Type') || '';
      let responseBody;
      
      if (contentType.includes('application/json')) {
        responseBody = await response.json();
        console.log(`BambooHR API response (JSON): ${JSON.stringify(responseBody).substring(0, 100)}...`);
      } else {
        responseBody = await response.text();
        console.log(`BambooHR API response (${contentType}): [${responseBody.length} bytes]`);
      }

      // Create response headers to return
      const responseHeaders: Record<string, string> = { ...corsHeaders };
      
      // Copy content type if available
      if (contentType) {
        responseHeaders['Content-Type'] = contentType;
      }

      return new Response(
        contentType.includes('application/json') ? JSON.stringify(responseBody) : responseBody,
        {
          headers: responseHeaders,
          status: response.status,
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: "Request timed out" }),
          { headers: COMMON_HEADERS, status: 504 }
        );
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Error handling BambooHR request:', error);
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }),
      { headers: COMMON_HEADERS, status: 500 }
    );
  }
});

/**
 * Get subdomain from request
 */
function getSubdomain(url: URL): string {
  // First check if subdomain is provided in query params
  const querySubdomain = url.searchParams.get('subdomain');
  if (querySubdomain) {
    return querySubdomain;
  }
  
  // If not in query params, check environment variable
  return Deno.env.get('BAMBOOHR_SUBDOMAIN') || '';
}

/**
 * Handle a request to check the secrets configuration
 */
async function handleSecretsCheck(req: Request): Promise<Response> {
  // Get the environment variables we need to check
  const subdomain = Deno.env.get('BAMBOOHR_SUBDOMAIN');
  const apiKey = Deno.env.get('BAMBOOHR_API_KEY');
  
  // Get all environment keys (names only)
  const envKeys = Object.keys(Deno.env.toObject());
  
  // Construct response
  const response = {
    success: true,
    secretsConfigured: !!(subdomain && apiKey),
    secrets: {
      BAMBOOHR_SUBDOMAIN: !!subdomain,
      BAMBOOHR_API_KEY: !!apiKey
    },
    environmentKeys: envKeys,
    timestamp: new Date().toISOString()
  };
  
  return new Response(
    JSON.stringify(response),
    { headers: COMMON_HEADERS, status: 200 }
  );
}

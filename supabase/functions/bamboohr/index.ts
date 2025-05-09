
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Environment variable types for TypeScript
interface Env {
  BAMBOOHR_SUBDOMAIN: string;
  BAMBOOHR_API_KEY: string;
}

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Function to build the BambooHR API URL
function buildBambooHRUrl(subdomain: string, endpoint: string): string {
  return `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1${endpoint}`;
}

// Main handler function for the Edge Function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }
  
  try {
    const env = Deno.env.toObject() as Env;
    
    // Check if environment variables are set
    if (!env.BAMBOOHR_SUBDOMAIN || !env.BAMBOOHR_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "BambooHR credentials not configured. Please set BAMBOOHR_SUBDOMAIN and BAMBOOHR_API_KEY environment variables." 
        }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }

    // Parse the request URL to get the BambooHR endpoint and optional subdomain override
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Get subdomain from query parameter (if provided) or use the environment variable
    let subdomain = url.searchParams.get('subdomain') || env.BAMBOOHR_SUBDOMAIN;
    
    // Remove subdomain from searchParams to avoid sending it to BambooHR API
    url.searchParams.delete('subdomain');
    
    // Extract the part after /functions/v1/bamboohr
    const bambooEndpoint = path.includes('/bamboohr') 
      ? path.substring(path.indexOf('/bamboohr') + '/bamboohr'.length) 
      : path;
    
    if (!bambooEndpoint) {
      return new Response(
        JSON.stringify({ error: "No BambooHR endpoint specified" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
    
    console.log(`Edge Function: Using subdomain: ${subdomain}`);
    console.log(`Edge Function: Extracted bambooEndpoint: ${bambooEndpoint}`);
    
    // Build the full BambooHR API URL
    const apiUrl = buildBambooHRUrl(subdomain, bambooEndpoint);
    
    // Forward remaining query parameters if any
    const queryString = url.search.replace(/^\?subdomain=[^&]*&?/, '?').replace(/^\?$/, '');
    const fullApiUrl = queryString && queryString !== '?' ? `${apiUrl}${queryString}` : apiUrl;
    
    console.log(`Edge Function: Making request to: ${fullApiUrl}`);
    
    // Create headers for BambooHR API
    const headers = new Headers();
    // Base64 encode API key with empty username as per BambooHR docs
    const authHeader = "Basic " + btoa(`${env.BAMBOOHR_API_KEY}:`);
    headers.append("Authorization", authHeader);
    headers.append("Accept", "application/json");
    
    // Forward content-type header if it's a POST/PUT request
    if (req.method === "POST" || req.method === "PUT") {
      const contentType = req.headers.get("Content-Type");
      if (contentType) {
        headers.append("Content-Type", contentType);
      } else {
        headers.append("Content-Type", "application/json");
      }
    }
    
    // Make the request to BambooHR API
    const response = await fetch(fullApiUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    });
    
    // Check for HTML responses (which usually indicate auth errors)
    const contentType = response.headers.get("Content-Type") || "";
    if (contentType.includes("text/html")) {
      const htmlText = await response.text();
      return new Response(
        JSON.stringify({ 
          error: "BambooHR returned HTML instead of JSON. This likely indicates an authentication issue.",
          status: response.status,
          statusText: response.statusText,
          subdomain: subdomain,
          htmlPreview: htmlText.substring(0, 200) + "..."
        }),
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
    
    // If response is not JSON, return it as-is with appropriate status
    if (!contentType.includes("application/json")) {
      const responseText = await response.text();
      return new Response(
        JSON.stringify({ 
          error: "BambooHR returned non-JSON response",
          status: response.status,
          statusText: response.statusText,
          contentType,
          responsePreview: responseText.substring(0, 200) + "..."
        }),
        { 
          status: response.status, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }
    
    // Return the JSON response
    const responseData = await response.json();
    
    // Return the response with appropriate headers
    return new Response(
      JSON.stringify(responseData),
      { 
        status: response.status, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error("Error in BambooHR Edge Function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error in BambooHR Edge Function", 
        details: error.message
      }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});

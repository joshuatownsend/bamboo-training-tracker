
// BambooHR API proxy edge function
// This function proxies requests to BambooHR API to avoid CORS issues and keep API keys secure

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers to allow cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-auth-check, x-bamboohr-auth",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

// Handle requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  // Log the incoming request
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/bamboohr/, "");
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] BambooHR Edge Function received request: ${req.method} ${url}`);
  
  // Special endpoint to check if secrets are properly configured
  if (path === "/check-secrets") {
    console.log(`[${timestamp}] Checking secrets configuration...`);
    
    // Check for existence of environment variables and log their exact names
    const allEnvKeys = Object.keys(Deno.env.toObject());
    console.log(`[${timestamp}] All environment keys: ${JSON.stringify(allEnvKeys)}`);
    
    // Try different case variations of the subdomain secret
    const subdomain = Deno.env.get("BAMBOOHR_SUBDOMAIN");
    const subdomainLower = Deno.env.get("bamboohr_subdomain");
    const subdomainUpper = Deno.env.get("BAMBOOHR_SUBDOMAIN");
    const apiKey = Deno.env.get("BAMBOOHR_API_KEY");
    
    console.log(`[${timestamp}] Secret check detailed results:`);
    console.log(`[${timestamp}] - BAMBOOHR_SUBDOMAIN: ${!!subdomain} (value: ${subdomain ? 'exists' : 'undefined'})`);
    console.log(`[${timestamp}] - bamboohr_subdomain: ${!!subdomainLower} (value: ${subdomainLower ? 'exists' : 'undefined'})`);
    console.log(`[${timestamp}] - BAMBOOHR_SUBDOMAIN: ${!!subdomainUpper} (value: ${subdomainUpper ? 'exists' : 'undefined'})`);
    console.log(`[${timestamp}] - BAMBOOHR_API_KEY: ${!!apiKey} (value: ${apiKey ? '[REDACTED]' : 'undefined'})`);
    
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
        timestamp: timestamp,
        deploymentVerification: "Debug function updated"
      }),
      { headers: corsHeaders, status: 200 }
    );
  }
  
  try {
    // Get BambooHR credentials from environment variables
    // Try multiple case variations in case that's the issue
    const subdomain = Deno.env.get("BAMBOOHR_SUBDOMAIN") || Deno.env.get("bamboohr_subdomain") || url.searchParams.get("subdomain") || "";
    const apiKey = Deno.env.get("BAMBOOHR_API_KEY") || Deno.env.get("bamboohr_api_key") || "";
    
    console.log(`[${timestamp}] Using subdomain: ${subdomain || '(not found)'}`);
    
    // Check for required credentials
    if (!subdomain || !apiKey) {
      console.error(`[${timestamp}] Missing BambooHR credentials - BAMBOOHR_SUBDOMAIN: ${!!subdomain}, BAMBOOHR_API_KEY: ${!!apiKey}`);
      return new Response(
        JSON.stringify({ 
          error: "Missing BambooHR credentials in environment variables", 
          details: {
            BAMBOOHR_SUBDOMAIN: !!subdomain,
            BAMBOOHR_API_KEY: !!apiKey
          },
          timestamp: timestamp
        }),
        { headers: corsHeaders, status: 500 }
      );
    }
    
    // Build the target BambooHR URL
    const targetUrl = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1${path}${url.search}`;
    
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
    console.log(`[${timestamp}] Forwarding request to: ${targetUrl}`);
    console.log(`[${timestamp}] Headers: ${JSON.stringify([...headers.entries()]
      .filter(([key]) => key.toLowerCase() !== "authorization")
      .map(([key, value]) => [key, value])
    )}`);
    
    // Forward the request to BambooHR
    const bambooResponse = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: ["GET", "HEAD", "OPTIONS"].includes(req.method) ? undefined : await req.text(),
    });
    
    // Get response data
    let responseData;
    const responseContentType = bambooResponse.headers.get("content-type") || "";
    
    if (responseContentType.includes("application/json")) {
      responseData = await bambooResponse.text();
      // Log truncated response for debugging
      console.log(`[${timestamp}] BambooHR API response (JSON): ${responseData.substring(0, 200)}...`);
    } else {
      responseData = await bambooResponse.text();
      console.log(`[${timestamp}] BambooHR API response (${responseContentType}): [${responseData.length} bytes]`);
    }
    
    // Return the response with CORS headers
    return new Response(responseData, {
      status: bambooResponse.status,
      headers: {
        ...corsHeaders,
        "Content-Type": responseContentType
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${timestamp}] Error processing BambooHR request:`, errorMessage);
    
    return new Response(
      JSON.stringify({
        error: "Error processing BambooHR request",
        message: errorMessage,
        timestamp: timestamp
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});

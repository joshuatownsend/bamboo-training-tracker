
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
  console.log(`BambooHR Edge Function received request: ${req.method} ${url}`);
  
  // Special endpoint to check if secrets are properly configured
  if (path === "/check-secrets") {
    console.log("Checking secrets configuration...");
    
    // Check for existence of environment variables
    const subdomain = Deno.env.get("BAMBOOHR_SUBDOMAIN");
    const apiKey = Deno.env.get("BAMBOOHR_API_KEY");
    
    return new Response(
      JSON.stringify({
        success: true,
        secrets: {
          BAMBOOHR_SUBDOMAIN: !!subdomain,
          BAMBOOHR_API_KEY: !!apiKey
        },
        timestamp: new Date().toISOString()
      }),
      { headers: corsHeaders, status: 200 }
    );
  }
  
  try {
    // Get BambooHR credentials from environment variables
    const subdomain = Deno.env.get("BAMBOOHR_SUBDOMAIN") || url.searchParams.get("subdomain") || "";
    const apiKey = Deno.env.get("BAMBOOHR_API_KEY") || "";
    
    // Check for required credentials
    if (!subdomain || !apiKey) {
      console.error("Missing BambooHR credentials");
      return new Response(
        JSON.stringify({ 
          error: "Missing BambooHR credentials in environment variables", 
          details: {
            BAMBOOHR_SUBDOMAIN: !!subdomain,
            BAMBOOHR_API_KEY: !!apiKey
          }
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
    console.log(`Forwarding request to: ${targetUrl}`);
    console.log(`Headers: ${JSON.stringify([...headers.entries()]
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
      console.log(`BambooHR API response (JSON): ${responseData.substring(0, 200)}...`);
    } else {
      responseData = await bambooResponse.text();
      console.log(`BambooHR API response (${responseContentType}): [${responseData.length} bytes]`);
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
    console.error("Error processing BambooHR request:", error);
    
    return new Response(
      JSON.stringify({
        error: "Error processing BambooHR request",
        message: error instanceof Error ? error.message : String(error)
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});

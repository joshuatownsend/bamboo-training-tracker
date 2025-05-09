
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get subdomain from env var
    const subdomain = Deno.env.get("BAMBOOHR_SUBDOMAIN");
    const apiKey = Deno.env.get("BAMBOOHR_API_KEY");

    if (!subdomain || !apiKey) {
      console.error("Missing BambooHR credentials in environment variables");
      return new Response(
        JSON.stringify({
          error: "BambooHR credentials not configured on the server",
          details: {
            subdomain_set: !!subdomain,
            apikey_set: !!apiKey
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Process URL - get the path that comes after /bamboohr
    const url = new URL(req.url);
    let path = url.pathname.replace(/^\/bamboohr\/?/, "");
    
    // Get the subdomain parameter from the query string (for diagnostic purposes only)
    // Note: We'll always use the server's environment variable for actual API calls
    const diagnosticSubdomain = url.searchParams.get("subdomain");
    
    console.log(`Processing BambooHR request: ${req.method} ${path}`);
    console.log(`Using server-configured subdomain: ${subdomain}`);
    console.log(`Diagnostic subdomain parameter: ${diagnosticSubdomain || 'not provided'}`);

    // Create the target URL for BambooHR API
    const targetUrl = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/${path}${url.search ? url.search : ""}`;

    // Create headers for BambooHR API
    const headers = new Headers();
    headers.append("Authorization", `Basic ${btoa(`${apiKey}:`)}`);
    headers.append("Accept", "application/json");
    
    // If we're doing a POST or PUT, add content type
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      headers.append("Content-Type", "application/json");
    }

    console.log(`Forwarding to BambooHR: ${req.method} ${targetUrl}`);
    
    // Forward the request to BambooHR
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ["GET", "HEAD", "OPTIONS"].includes(req.method) ? undefined : await req.text(),
    });

    console.log(`BambooHR responded with status: ${response.status}`);

    // Read response body
    const responseBody = await response.text();
    
    // Check if the response is JSON or HTML
    const contentType = response.headers.get("content-type") || "";
    console.log(`Response content type: ${contentType}`);
    
    if (contentType.includes("text/html")) {
      console.log("BambooHR returned HTML instead of JSON - likely an authentication issue");
      console.log("HTML preview:", responseBody.substring(0, 200) + "...");
      
      return new Response(
        JSON.stringify({
          error: "BambooHR authentication failed",
          details: "BambooHR returned HTML instead of JSON. This typically means the API credentials are invalid.",
          html_preview: responseBody.substring(0, 200) + "...",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }
    
    // Return the response from BambooHR
    return new Response(responseBody, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
      },
    });

  } catch (error) {
    console.error("Error in BambooHR edge function:", error);
    
    return new Response(
      JSON.stringify({
        error: `Error processing BambooHR request: ${error.message}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

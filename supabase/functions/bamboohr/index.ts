
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-auth-check, x-bamboohr-auth",
};

serve(async (req) => {
  console.log("BambooHR Edge Function received request:", req.method, req.url);
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get subdomain and API key from env vars
    const serverSubdomain = Deno.env.get("BAMBOOHR_SUBDOMAIN");
    const apiKey = Deno.env.get("BAMBOOHR_API_KEY");
    
    // Debug logging to help diagnose the issue
    console.log(`BAMBOOHR_SUBDOMAIN env var: ${serverSubdomain ? "Set" : "Not set"}`);
    console.log(`BAMBOOHR_API_KEY env var: ${apiKey ? "Set" : "Not set"}`);
    
    // Get the URL and query params
    const url = new URL(req.url);
    
    // Get the subdomain parameter from query string (for diagnostic or override purposes)
    // By default, use the server-configured subdomain
    const querySubdomain = url.searchParams.get("subdomain");
    const subdomain = serverSubdomain || querySubdomain || '';
    
    // Log ALL request headers for debugging (redacting sensitive values)
    console.log("All request headers:");
    for (const [key, value] of req.headers.entries()) {
      console.log(`${key}: ${key.toLowerCase().includes('auth') ? '[REDACTED]' : value}`);
    }

    // Look for any auth-related headers
    const hasAuthHeader = req.headers.has("Authorization");
    const hasBambooAuthHeader = req.headers.has("X-BambooHR-Auth");
    console.log(`Has Authorization header: ${hasAuthHeader}`);
    console.log(`Has X-BambooHR-Auth header: ${hasBambooAuthHeader}`);

    console.log(`Processing request with subdomain: ${subdomain}`);
    console.log(`API Key present: ${!!apiKey}`);
    
    if (!subdomain || !apiKey) {
      console.error("Missing BambooHR credentials in environment variables");
      const missingItems = [];
      if (!subdomain) missingItems.push("subdomain");
      if (!apiKey) missingItems.push("API key");
      
      return new Response(
        JSON.stringify({
          error: "BambooHR credentials not configured on the server",
          details: {
            subdomain_set: !!subdomain,
            apikey_set: !!apiKey,
            missing: missingItems.join(", "),
            message: `Missing ${missingItems.join(" and ")} in Edge Function configuration. Please check the Supabase secrets.`,
            tested_subdomain: subdomain || querySubdomain || 'not provided'
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Process URL - get the path that comes after /bamboohr
    let path = url.pathname.replace(/^\/bamboohr\/?/, "");
    path = path.replace(/^\/functions\/v1\/bamboohr\/?/, "");
    
    // If no path is specified, default to employees/directory
    if (!path) {
      console.log("No path specified, defaulting to employees/directory");
      path = "employees/directory";
    }
    
    // Remove the subdomain parameter from the query string since we'll use it directly
    if (querySubdomain) {
      url.searchParams.delete("subdomain");
    }
    
    console.log(`Processing BambooHR request: ${req.method} ${path}`);
    console.log(`Using subdomain: ${subdomain}`);

    // Create the target URL for BambooHR API
    const targetUrl = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/${path}${url.search ? url.search : ""}`;
    console.log(`Forwarding to BambooHR API: ${req.method} ${targetUrl}`);

    // Create headers for BambooHR API with authentication
    const headers = new Headers();
    
    // This is the critical part - add proper BambooHR authentication
    // IMPORTANT: BambooHR requires the API key as the username and an empty string as the password
    const authHeader = `Basic ${btoa(`${apiKey}:`)}`;
    headers.append("Authorization", authHeader);
    console.log("Added Authorization header for BambooHR API");
    
    headers.append("Accept", "application/json");
    
    // If we're doing a POST or PUT, add content type
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      headers.append("Content-Type", "application/json");
    }
    
    try {
      console.log(`Sending request to BambooHR API with auth: ${req.method} ${targetUrl}`);
      
      // Log the headers we're sending (without the actual API key)
      console.log("Headers being sent:", 
        JSON.stringify(
          Object.fromEntries([...headers.entries()].map(([key, value]) => 
            key.toLowerCase() === 'authorization' ? [key, '***'] : [key, value]
          ))
        )
      );
      
      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: ["GET", "HEAD", "OPTIONS"].includes(req.method) ? undefined : await req.text(),
        credentials: 'omit', // Don't send cookies
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
        
        // Check if it's a login page by looking for typical login page elements
        const isLoginPage = responseBody.toLowerCase().includes('login') || 
                           responseBody.toLowerCase().includes('password') || 
                           responseBody.toLowerCase().includes('sign in');
                           
        return new Response(
          JSON.stringify({
            error: "BambooHR authentication failed",
            details: isLoginPage 
              ? "BambooHR returned a login page instead of API data. This means your API credentials are invalid or expired."
              : "BambooHR returned HTML instead of JSON. This typically means the API credentials are invalid.",
            html_preview: responseBody.substring(0, 200) + "...",
            status_code: response.status,
            is_login_page: isLoginPage,
            tested_subdomain: subdomain
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          }
        );
      }
      
      // Log the response body preview for debugging
      console.log("Response body preview:", responseBody.substring(0, 200) + (responseBody.length > 200 ? "..." : ""));
      
      // Return the response from BambooHR
      return new Response(responseBody, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType || "application/json",
        },
      });

    } catch (fetchError) {
      console.error("Error fetching from BambooHR API:", fetchError);
      return new Response(
        JSON.stringify({
          error: "BambooHR API request failed",
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
          request_url: targetUrl,
          tested_subdomain: subdomain
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

  } catch (error) {
    console.error("Error in BambooHR edge function:", error);
    
    return new Response(
      JSON.stringify({
        error: `Error processing BambooHR request: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

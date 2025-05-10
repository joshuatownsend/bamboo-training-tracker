
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handlers, corsHeaders, logWithTimestamp } from "./handlers.ts";

// BambooHR API timeout (increased to 60 seconds for better chance of success)
const API_TIMEOUT = 60000;

// Define the serve handler function
serve(async (req) => {
  console.log(`BambooHR Edge Function received request: ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Common error handler with detailed logging
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/bamboohr\//, '');
    
    // Detailed request logging
    logWithTimestamp(`Processing ${req.method} request for path: ${path}`);
    logWithTimestamp(`Query parameters: ${url.search}`);
    
    // Check if this is a secrets check request
    if (path.endsWith('check')) {
      logWithTimestamp("Handling secrets check request");
      return handlers.handleSecretsCheck(req);
    }
    
    // Handle standard BambooHR API request
    return await handlers.handleBambooHRRequest(req, "/" + path, url.searchParams);
  } 
  catch (error) {
    // Enhanced error logging for better debugging
    logWithTimestamp(`Critical error in edge function: ${error.message}`);
    if (error.stack) {
      logWithTimestamp(`Stack trace: ${error.stack}`);
    }
    
    // Return structured error response
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        path: new URL(req.url).pathname
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }, 
        status: 500 
      }
    );
  }
});

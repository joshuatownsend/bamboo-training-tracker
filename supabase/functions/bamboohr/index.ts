// BambooHR API proxy edge function
// This function proxies requests to BambooHR API to avoid CORS issues and keep API keys secure

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPreflightRequest, logWithTimestamp, createErrorResponse } from "./utils.ts";
import { handleSecretsCheck, handleBambooHRRequest } from "./handlers.ts";

// Handle requests
serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return handleCorsPreflightRequest();
    }
    
    // Log the incoming request
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/bamboohr/, "");
    const timestamp = new Date().toISOString();
    logWithTimestamp(`BambooHR Edge Function received request: ${req.method} ${url}`);
    
    // Special endpoint to check if secrets are properly configured
    if (path === "/check-secrets") {
      return await handleSecretsCheck(req);
    }
    
    // Handle BambooHR API request
    return await handleBambooHRRequest(req, path, url.searchParams);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logWithTimestamp(`Error processing BambooHR request: ${errorMessage}`);
    
    return createErrorResponse(500, "Error processing BambooHR request", { message: errorMessage });
  }
});


// Utility functions for BambooHR Edge Function

// Define CORS headers to allow cross-origin requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-auth-check, x-bamboohr-auth",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

// Helper function to clean up secret values
export const cleanSecret = (secret: string | null): string | null => {
  if (!secret) return null;
  // Remove any whitespace, newlines, carriage returns
  return secret.trim().replace(/[\r\n]+/g, '');
};

// Handle CORS preflight requests
export function handleCorsPreflightRequest(): Response {
  console.log("Handling OPTIONS request");
  return new Response(null, { headers: corsHeaders, status: 204 });
}

// Helper to get BambooHR credentials from environment variables
export function getBambooCredentials(searchParams: URLSearchParams): {
  subdomain: string;
  apiKey: string;
  hasCredentials: boolean;
} {
  // Get BambooHR credentials from environment variables
  // Clean the subdomain value to handle potential whitespace issues
  const subdomainRaw = Deno.env.get("BAMBOOHR_SUBDOMAIN") || 
                      Deno.env.get("bamboohr_subdomain") || 
                      searchParams.get("subdomain") || "";
  const subdomain = cleanSecret(subdomainRaw) || "";
  const apiKey = Deno.env.get("BAMBOOHR_API_KEY") || Deno.env.get("bamboohr_api_key") || "";
  
  const hasCredentials = !!subdomain && !!apiKey;
  
  return { subdomain, apiKey, hasCredentials };
}

// Log formatted time entries
export function logWithTimestamp(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Helper function for error responses
export function createErrorResponse(status: number, message: string, details: Record<string, any> = {}): Response {
  const timestamp = new Date().toISOString();
  return new Response(
    JSON.stringify({ 
      error: message, 
      details,
      timestamp 
    }),
    { 
      headers: corsHeaders, 
      status 
    }
  );
}

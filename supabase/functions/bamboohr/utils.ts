
// CORS headers for the edge function
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Log with timestamp for edge function
 * @param message Message to log
 */
export function logWithTimestamp(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Clean a secret value by removing whitespace and newlines
 * @param value Secret value to clean
 * @returns Cleaned secret value
 */
export function cleanSecret(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim();
}

/**
 * Get BambooHR credentials from environment variables or query parameters
 * @param params URL search params that may contain credentials
 * @returns Object with subdomain, apiKey, and hasCredentials flag
 */
export function getBambooCredentials(params: URLSearchParams): { 
  subdomain: string, 
  apiKey: string, 
  hasCredentials: boolean 
} {
  // Try to get subdomain from query params first, then environment
  let subdomain = params.get('subdomain') || '';
  if (!subdomain) {
    subdomain = cleanSecret(Deno.env.get('BAMBOOHR_SUBDOMAIN')) || 
               cleanSecret(Deno.env.get('bamboohr_subdomain')) || '';
  }
  
  // Try to get API key from query params first, then environment
  let apiKey = params.get('apiKey') || '';
  if (!apiKey) {
    apiKey = cleanSecret(Deno.env.get('BAMBOOHR_API_KEY')) || '';
  }
  
  return {
    subdomain,
    apiKey,
    hasCredentials: !!subdomain && !!apiKey
  };
}

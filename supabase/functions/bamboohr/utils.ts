
// CORS headers to enable cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility function for consistent logging with timestamps
export function logWithTimestamp(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

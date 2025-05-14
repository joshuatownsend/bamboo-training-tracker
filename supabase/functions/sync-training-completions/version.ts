
import { corsHeaders } from "./cors.ts";

// Version endpoint to report the edge function version
Deno.serve(async (req) => {
  // This is a CORS preflight request. We need to respond with the correct headers.
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({
    version: "2.3.1",
    deployed_at: new Date().toISOString(),
    deployment_id: "v2_3_1_high_performance"
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
});


import { corsHeaders } from "./cors.ts";

interface VersionInfo {
  version: string;
  timestamp: string;
  buildId?: string;
  environment: string;
}

// Version information for the edge function
export const versionInfo: VersionInfo = {
  version: "1.0.1",
  timestamp: new Date().toISOString(),
  environment: Deno.env.get("ENVIRONMENT") || "production",
};

Deno.serve(async (req) => {
  // This is a CORS preflight request. We need to respond with the correct headers.
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const responseData = {
      ...versionInfo,
      serverTime: new Date().toISOString(),
      success: true,
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in version endpoint:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});

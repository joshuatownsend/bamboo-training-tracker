
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-auth-check, x-bamboohr-auth",
};

// Create a duration object for limiting how often the sync can run
// to prevent potential abuse of the endpoint
const MINIMUM_INTERVAL_MS = 60000; // 1 minute
let lastSyncTime = 0;

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Check if this is an authorized request
    // You can implement more robust auth checking if needed
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing or invalid authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    // Rate limiting - check if we've run this too recently
    const now = Date.now();
    if (now - lastSyncTime < MINIMUM_INTERVAL_MS) {
      const secondsToWait = Math.ceil((MINIMUM_INTERVAL_MS - (now - lastSyncTime)) / 1000);
      return new Response(
        JSON.stringify({ 
          error: "Rate limited", 
          message: `Please wait ${secondsToWait} seconds before syncing again.` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }
    
    // Update the last sync time
    lastSyncTime = now;
    
    // Get credentials from environment variables
    const subdomain = Deno.env.get("BAMBOOHR_SUBDOMAIN");
    const apiKey = Deno.env.get("BAMBOOHR_API_KEY");
    
    if (!subdomain || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing BambooHR credentials" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Create Supabase client with the service role key for admin operations
    const supabaseUrl = "https://fvpbkkmnzlxbcxokxkce.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing Supabase service role key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Create fetch options with Basic Auth for BambooHR
    const fetchOptions = {
      method: "GET",
      headers: {
        "Authorization": `Basic ${btoa(`${apiKey}:`)}`,
        "Accept": "application/json",
      },
    };
    
    // Fetch employee directory from BambooHR
    console.log(`Fetching employee directory from BambooHR (${subdomain})...`);
    const bambooResponse = await fetch(`https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/employees/directory`, fetchOptions);
    
    if (!bambooResponse.ok) {
      const errorText = await bambooResponse.text();
      console.error(`BambooHR API Error (${bambooResponse.status}):`, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: "BambooHR API Error", 
          status: bambooResponse.status,
          details: errorText.substring(0, 500)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const employeeData = await bambooResponse.json();
    console.log(`Retrieved ${employeeData.employees?.length || 0} employees from BambooHR`);
    
    // Check if we have employees data in the expected format
    if (!employeeData.employees || !Array.isArray(employeeData.employees)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid response format from BambooHR", 
          details: "Expected employees array in response" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Create mappings array for database operations
    const mappings = employeeData.employees
      .filter(emp => emp.workEmail && emp.id) // Only include employees with both email and ID
      .map(emp => ({
        email: emp.workEmail.toLowerCase(),
        bamboo_employee_id: emp.id.toString(),
        updated_at: new Date().toISOString()
      }));
    
    console.log(`Prepared ${mappings.length} employee mappings for database update`);
    
    // Initialize Supabase admin client for direct database operations
    // Note: In an edge function, we need to use fetch for Supabase operations
    const insertResults = await fetch(`${supabaseUrl}/rest/v1/employee_mappings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(mappings)
    });
    
    if (!insertResults.ok) {
      const errorText = await insertResults.text();
      console.error(`Supabase Error (${insertResults.status}):`, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: "Database update failed", 
          status: insertResults.status,
          details: errorText
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Employee mappings successfully synced",
        count: mappings.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error("Error in sync-employee-mappings function:", error);
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

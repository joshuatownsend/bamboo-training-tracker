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

// Function to check if edge function secrets are configured
function getSecretStatus() {
  // Check if required environment variables are set
  const subdomain = Deno.env.get("BAMBOOHR_SUBDOMAIN");
  const apiKey = Deno.env.get("BAMBOOHR_API_KEY");
  
  return {
    BAMBOOHR_SUBDOMAIN: !!subdomain,
    BAMBOOHR_API_KEY: !!apiKey
  };
}

// Function to log with timestamps for better debugging
function logWithTimestamp(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Special endpoint for checking secrets
    const url = new URL(req.url);
    if (url.pathname.endsWith("/check")) {
      const secretStatus = getSecretStatus();
      
      return new Response(
        JSON.stringify({
          success: true,
          secrets: secretStatus,
          allSecretsConfigured: Object.values(secretStatus).every(Boolean),
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    // Check if this is an authorized request
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logWithTimestamp("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized", 
          message: "Missing or invalid authorization header. You must be authenticated to use this endpoint."
        }),
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
    
    // Check if secrets are configured
    const secretStatus = getSecretStatus();
    if (!secretStatus.BAMBOOHR_SUBDOMAIN || !secretStatus.BAMBOOHR_API_KEY) {
      logWithTimestamp("Missing BambooHR credentials in environment variables: " + JSON.stringify(secretStatus));
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error", 
          message: "Missing BambooHR credentials. Please configure them in the Supabase secrets.",
          secretStatus 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Create Supabase client with the service role key for admin operations
    const supabaseUrl = "https://fvpbkkmnzlxbcxokxkce.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseKey) {
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error", 
          message: "Missing Supabase service role key. Please configure it in the Supabase secrets."
        }),
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
    
    logWithTimestamp(`Using Authorization header: Basic ${btoa(`${apiKey.substring(0, 3)}...:`)} for subdomain ${subdomain}`);
    
    // Fetch employee directory with expanded fields from BambooHR
    logWithTimestamp(`Fetching employee directory from BambooHR (${subdomain})...`);

    // Use the employee directory endpoint but request specific fields we need
    const fields = "id,displayName,firstName,lastName,jobTitle,department,division,workEmail,workEmail2,mobilePhone,hireDate,status,photoUploaded,photoUrl";
    const bambooResponse = await fetch(
      `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/employees/directory?fields=${fields}`,
      fetchOptions
    );
    
    if (!bambooResponse.ok) {
      const errorText = await bambooResponse.text();
      logWithTimestamp(`BambooHR API Error (${bambooResponse.status}): ${errorText}`);
      
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
    logWithTimestamp(`Retrieved ${employeeData.employees?.length || 0} employees from BambooHR`);
    
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
    
    // Create mappings array with expanded employee data for database operations
    const mappings = employeeData.employees
      .filter(emp => emp.workEmail && emp.id) // Only include employees with both email and ID
      .map(emp => ({
        email: emp.workEmail.toLowerCase(),
        bamboo_employee_id: emp.id.toString(),
        name: emp.displayName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        display_name: emp.displayName || null,
        first_name: emp.firstName || null,
        last_name: emp.lastName || null,
        position: emp.jobTitle || null,
        job_title: emp.jobTitle || null,
        department: emp.department || null,
        division: emp.division || null,
        work_email: emp.workEmail || null,
        avatar: emp.photoUrl || (emp.photoUploaded === 'yes' ? `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/employees/${emp.id}/photo` : null),
        hire_date: emp.hireDate || null,
        status: emp.status || null,
        updated_at: new Date().toISOString(),
        last_sync: new Date().toISOString()
      }));
    
    logWithTimestamp(`Prepared ${mappings.length} employee mappings for database update`);
    
    // Try updating records using upsert (insert if not exists, update if exists)
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
      logWithTimestamp(`Supabase Error (${insertResults.status}): ${errorText}`);
      
      // If we got a conflict error, try a different approach
      if (insertResults.status === 409) {
        logWithTimestamp("Received 409 conflict error, trying individual upserts...");
        
        // Try updating records one by one to handle the conflicts
        let successCount = 0;
        const errors = [];
        
        for (const mapping of mappings) {
          try {
            const upsertResponse = await fetch(`${supabaseUrl}/rest/v1/employee_mappings?email=eq.${encodeURIComponent(mapping.email)}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Prefer": "return=minimal"
              },
              body: JSON.stringify({
                bamboo_employee_id: mapping.bamboo_employee_id,
                name: mapping.name,
                display_name: mapping.display_name,
                first_name: mapping.first_name,
                last_name: mapping.last_name,
                position: mapping.position,
                job_title: mapping.job_title,
                department: mapping.department,
                division: mapping.division,
                work_email: mapping.work_email,
                avatar: mapping.avatar,
                hire_date: mapping.hire_date,
                status: mapping.status,
                updated_at: mapping.updated_at,
                last_sync: mapping.last_sync
              })
            });
            
            if (upsertResponse.ok) {
              successCount++;
            } else {
              const errorDetail = await upsertResponse.text();
              errors.push({
                email: mapping.email,
                error: errorDetail
              });
            }
          } catch (err) {
            errors.push({
              email: mapping.email,
              error: err.message || "Unknown error"
            });
          }
        }
        
        return new Response(
          JSON.stringify({
            success: successCount > 0,
            message: `Updated ${successCount} of ${mappings.length} employee mappings individually`,
            count: successCount,
            errors: errors.length > 0 ? errors.slice(0, 5) : [],
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      
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
    logWithTimestamp(`Error in sync-employee-mappings function: ${error instanceof Error ? error.message : String(error)}`);
    
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

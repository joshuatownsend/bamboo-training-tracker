
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

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

// Function to validate admin access
async function isAdminUser(email: string, supabase: any): Promise<boolean> {
  try {
    if (!email) return false;
    
    // 1. Check if the email is in admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle();
      
    if (adminData?.email) {
      logWithTimestamp(`${email} found in admin_users table - admin access granted`);
      return true;
    }
    
    // 2. Check if any admin settings list this email
    // This is a fallback if admin_users table doesn't contain the user
    
    // We'll use a direct SQL query for this to simplify checking in any possible settings
    const { data: settingsData, error: settingsError } = await supabase
      .rpc('check_admin_access', { admin_email: email.toLowerCase() });
    
    // If there's data and it indicates admin access
    if (settingsData === true) {
      logWithTimestamp(`${email} validated through admin settings - admin access granted`);
      return true;
    }
    
    logWithTimestamp(`${email} not found in admin lists - access denied`);
    return false;
  } catch (error) {
    logWithTimestamp(`Error validating admin access: ${error}`);
    return false;
  }
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
    
    // Parse the request body to get admin information
    const requestData = await req.json();
    let isAdminAuthenticated = false;
    let adminEmail = '';
    let adminName = '';
    
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseKey) {
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error", 
          message: "Missing Supabase service role key. Please configure it in the Supabase secrets."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Create Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify if this is an admin request
    if (requestData.adminRequest && requestData.adminEmail) {
      adminEmail = requestData.adminEmail;
      adminName = requestData.adminName || 'Admin User';
      
      // Validate if this email has admin access
      isAdminAuthenticated = await isAdminUser(adminEmail, supabase);
      
      if (!isAdminAuthenticated) {
        logWithTimestamp(`Admin authentication failed for ${adminEmail}`);
        return new Response(
          JSON.stringify({ 
            error: "Unauthorized", 
            message: "You don't have admin privileges to perform this operation."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
      
      logWithTimestamp(`Admin request authenticated for ${adminEmail}`);
    } else {
      // Fall back to traditional JWT validation if not an admin request
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
      
      // Extract the JWT token
      const token = authHeader.replace('Bearer ', '');
      
      // Verify the JWT token
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        logWithTimestamp(`Auth error: ${authError?.message || 'Invalid token'}`);
        return new Response(
          JSON.stringify({ 
            error: "Unauthorized", 
            message: "Invalid authentication token. Please log in again."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }
      
      isAdminAuthenticated = true;
      adminEmail = user.email || '';
      logWithTimestamp(`Authenticated request from user: ${adminEmail}`);
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
    
    // Try updating records using upsert
    const { data, error: upsertError } = await supabase
      .from('employee_mappings')
      .upsert(mappings, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      logWithTimestamp(`Supabase upsert error: ${upsertError.message}`);
      
      // Try individual updates as a fallback
      let successCount = 0;
      const errors = [];
      
      for (const mapping of mappings) {
        try {
          const { error: individualError } = await supabase
            .from('employee_mappings')
            .upsert([mapping], { 
              onConflict: 'email',
              ignoreDuplicates: false 
            });
          
          if (!individualError) {
            successCount++;
          } else {
            errors.push({
              email: mapping.email,
              error: individualError.message
            });
          }
        } catch (err) {
          errors.push({
            email: mapping.email,
            error: err instanceof Error ? err.message : "Unknown error"
          });
        }
      }
      
      // Update the sync status
      await supabase
        .from('sync_status')
        .upsert({
          id: 'bamboohr',
          status: successCount > 0 ? 'completed' : 'error',
          error: successCount === 0 ? "Failed to update employee mappings" : null,
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
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
    
    // Update the sync status
    await supabase
      .from('sync_status')
      .upsert({
        id: 'bamboohr',
        status: 'completed',
        error: null,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
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

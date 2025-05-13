import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// VERSION TRACKING - DO NOT MODIFY THIS SECTION MANUALLY
// These constants help identify which version is actually running
const FUNCTION_VERSION = "1.2.0";
const DEPLOYMENT_TIMESTAMP = "2025-05-13T14:30:00Z";
const DEPLOYMENT_ID = "v1_2_0_enhanced_logging";

// CORS Headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bamboohr-auth",
};

// Create a Supabase client with the service role key
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://fvpbkkmnzlxbcxokxkce.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// BambooHR API settings
const bambooSubdomain = Deno.env.get("BAMBOOHR_SUBDOMAIN") || "avfrd";
const bambooApiKey = Deno.env.get("BAMBOOHR_API_KEY") || "";

// Helper function to add delay between API requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Log function startup with version information
console.log(`[${DEPLOYMENT_TIMESTAMP}] Starting sync-training-completions edge function - Version ${FUNCTION_VERSION} (${DEPLOYMENT_ID})`);
console.log(`API Configuration - Supabase URL: ${supabaseUrl ? "Set" : "Missing"}, BambooHR Subdomain: ${bambooSubdomain ? "Set" : "Missing"}`);
console.log(`API Keys - Supabase: ${supabaseKey ? "Set" : "Missing"}, BambooHR: ${bambooApiKey ? "Set (Masked)" : "Missing"}`);

/**
 * Helper to securely log auth headers by masking sensitive parts
 */
function logAuthHeaders(headers: Headers): Record<string, string> {
  const sanitizedHeaders: Record<string, string> = {};
  
  // Clone the headers to avoid modifying the original
  const headerEntries = Array.from(headers.entries());
  
  headerEntries.forEach(([key, value]) => {
    if (key.toLowerCase() === 'authorization') {
      // Mask the token, only show first few chars
      const parts = value.split(' ');
      if (parts.length === 2) {
        const tokenType = parts[0];
        const token = parts[1];
        sanitizedHeaders[key] = `${tokenType} ${token.substring(0, 8)}...`;
      } else {
        sanitizedHeaders[key] = "Invalid format";
      }
    } else if (key.toLowerCase() === 'apikey' || key.toLowerCase() === 'x-api-key') {
      // Mask API keys completely
      sanitizedHeaders[key] = "***MASKED***";
    } else {
      // Keep other headers as is
      sanitizedHeaders[key] = value;
    }
  });
  
  return sanitizedHeaders;
}

/**
 * Generate a unique request ID to track operations through logs
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

async function fetchEmployees() {
  const requestId = generateRequestId();
  console.log(`[${requestId}] Fetching employees from BambooHR`);
  
  const apiUrl = `https://api.bamboohr.com/api/gateway.php/${bambooSubdomain}/v1/employees/directory`;
  const headers = {
    "Accept": "application/json",
    "Authorization": `Basic ${btoa(`${bambooApiKey}:x`)}`,
  };
  
  try {
    console.log(`[${requestId}] Making BambooHR API request to ${apiUrl}`);
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `Failed to fetch employees: ${response.status} ${response.statusText} - ${errorText}`;
      console.error(`[${requestId}] ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log(`[${requestId}] Fetched ${data.employees?.length || 0} employees from BambooHR`);
    return { employees: data.employees || [], requestId };
  } catch (error) {
    console.error(`[${requestId}] Error fetching employees:`, error);
    throw error;
  }
}

// Improved fetchTrainingRecords with retry logic and better error handling
async function fetchTrainingRecords(employeeId: string, requestId: string, maxRetries = 3) {
  console.log(`[${requestId}] Fetching training records for employee ${employeeId} (attempt 1/${maxRetries + 1})`);
  
  const apiUrl = `https://api.bamboohr.com/api/gateway.php/${bambooSubdomain}/v1/training/record/employee/${employeeId}`;
  const headers = {
    "Accept": "application/json",
    "Authorization": `Basic ${btoa(`${bambooApiKey}:x`)}`,
  };
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // On retry attempts, add exponential backoff
      if (attempt > 0) {
        const backoffTime = Math.pow(2, attempt) * 500; // 1s, 2s, 4s backoff
        console.log(`[${requestId}] Retry attempt ${attempt + 1}/${maxRetries + 1} for employee ${employeeId}, waiting ${backoffTime}ms`);
        await delay(backoffTime);
      }
      
      console.log(`[${requestId}] Making BambooHR API request to ${apiUrl} (attempt ${attempt + 1})`);
      const response = await fetch(apiUrl, { headers });
      
      // Handle 404 gracefully (employee without training records)
      if (response.status === 404) {
        console.log(`[${requestId}] No training records found for employee ${employeeId} (404 response) - This is expected for employees without training records`);
        return { records: [], employeeId, requestId };
      }
      
      // Handle rate limiting (503 Service Unavailable)
      if (response.status === 503) {
        console.log(`[${requestId}] Rate limiting detected (503) for employee ${employeeId}`);
        if (attempt < maxRetries) {
          continue; // Retry with backoff
        } else {
          console.log(`[${requestId}] Max retries reached for employee ${employeeId}, skipping`);
          return { records: [], employeeId, requestId, error: "Max retries exhausted due to rate limiting" };
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to fetch training records: ${response.status} ${response.statusText} - ${errorText}`;
        console.error(`[${requestId}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log(`[${requestId}] Successfully fetched ${Object.keys(data || {}).length} training records for employee ${employeeId}`);
      return { records: data || [], employeeId, requestId };
    } catch (error) {
      console.error(`[${requestId}] Error fetching training records for employee ${employeeId} (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      if (attempt < maxRetries) {
        continue; // Retry with backoff
      } else {
        console.log(`[${requestId}] Max retries reached for employee ${employeeId}, skipping`);
        return { 
          records: [], 
          employeeId, 
          requestId,
          error: error instanceof Error ? error.message : "Unknown error after max retries" 
        };
      }
    }
  }
  
  return { 
    records: [], 
    employeeId, 
    requestId,
    error: "Exceeded retry attempts"
  };
}

async function saveTrainingCompletions(completions: any[], requestId: string) {
  if (!completions.length) {
    console.log(`[${requestId}] No completions to save`);
    return { inserted: 0, errors: 0, requestId };
  }
  
  console.log(`[${requestId}] Saving ${completions.length} training completions to database`);
  
  let inserted = 0;
  let errors = 0;
  let errorDetails: string[] = [];
  
  // Process in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < completions.length; i += batchSize) {
    const batch = completions.slice(i, i + batchSize);
    const batchId = `${requestId}_batch_${Math.floor(i / batchSize)}`;
    
    try {
      console.log(`[${batchId}] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(completions.length / batchSize)} (size: ${batch.length})`);
      
      // First, delete existing completions for these employee_id/training_id combinations
      const employeeIds = [...new Set(batch.map(c => c.employee_id))];
      const trainingIds = [...new Set(batch.map(c => c.training_id))];
      
      if (employeeIds.length > 0 && trainingIds.length > 0) {
        // Delete existing records for these employees and trainings
        console.log(`[${batchId}] Deleting existing records for ${employeeIds.length} employees and ${trainingIds.length} trainings`);
        const { error: deleteError } = await supabase
          .from('employee_training_completions')
          .delete()
          .in('employee_id', employeeIds)
          .in('training_id', trainingIds);
          
        if (deleteError) {
          console.error(`[${batchId}] Error deleting existing completions:`, deleteError);
          errorDetails.push(`Batch ${Math.floor(i / batchSize) + 1} delete error: ${deleteError.message}`);
        }
      }
      
      // Now insert the new records
      console.log(`[${batchId}] Inserting ${batch.length} new completion records`);
      const { data, error } = await supabase
        .from('employee_training_completions')
        .insert(batch);
        
      if (error) {
        console.error(`[${batchId}] Error inserting completions:`, error);
        errors += batch.length;
        errorDetails.push(`Batch ${Math.floor(i / batchSize) + 1} insert error: ${error.message}`);
      } else {
        inserted += batch.length;
        console.log(`[${batchId}] Successfully inserted ${batch.length} records`);
      }
    } catch (error) {
      console.error(`[${batchId}] Error processing batch:`, error);
      errors += batch.length;
      errorDetails.push(`Batch ${Math.floor(i / batchSize) + 1} unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return { inserted, errors, errorDetails, requestId };
}

async function syncTrainingCompletions(requestId: string) {
  try {
    console.log(`[${requestId}] Starting training completions synchronization`);
    
    // Update sync status to running
    const { error: statusUpdateError } = await supabase
      .from('sync_status')
      .update({ 
        status: 'running', 
        error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'training_completions');
    
    if (statusUpdateError) {
      console.error(`[${requestId}] Error updating sync status:`, statusUpdateError);
    }
    
    // Insert a record if it doesn't exist
    const { error: insertError } = await supabase
      .from('sync_status')
      .insert({ 
        id: 'training_completions', 
        status: 'running', 
        updated_at: new Date().toISOString() 
      })
      .onConflict('id')
      .ignore();
    
    if (insertError) {
      console.error(`[${requestId}] Error inserting sync status:`, insertError);
    }
    
    // 1. Fetch all employees
    const { employees, requestId: employeeRequestId } = await fetchEmployees();
    console.log(`[${requestId}] Processing ${employees.length} employees`);
    
    // 2. For each employee, fetch and process their training records
    const allCompletions = [];
    const failedEmployees = [];
    const employeeResults: Record<string, any> = {};
    
    // Circuit breaker pattern to prevent continuing if too many errors
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5;
    
    // Process employees sequentially rather than in parallel to avoid rate limiting
    // This is slower but more reliable
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const employeeId = employee.id;
      console.log(`[${requestId}] Processing employee ${i + 1}/${employees.length}: ID ${employeeId}`);
      
      try {
        // Add a small delay between employee processing to avoid rate limiting
        if (i > 0) {
          await delay(300); // 300ms delay between employee processing
        }
        
        const { records, error: fetchError } = await fetchTrainingRecords(employeeId, requestId);
        
        if (fetchError) {
          console.warn(`[${requestId}] Error fetching training records for employee ${employeeId}: ${fetchError}`);
          failedEmployees.push({ id: employeeId, error: fetchError });
          employeeResults[employeeId] = { success: false, error: fetchError };
          consecutiveFailures++;
        } else {
          // Reset consecutive failures counter on success
          consecutiveFailures = 0;
          
          // Map records to our database format
          if (Array.isArray(records)) {
            const employeeCompletions = records.map((record: any) => ({
              employee_id: parseInt(employeeId, 10),
              training_id: parseInt(record.typeId, 10),
              completion_date: record.completed,
              notes: record.notes || null,
              instructor: record.instructor || null,
            }));
            
            allCompletions.push(...employeeCompletions);
            employeeResults[employeeId] = { success: true, count: employeeCompletions.length };
          } else if (records && typeof records === 'object') {
            // Handle case where records is an object, not an array
            const recordsArray = Object.values(records);
            const employeeCompletions = recordsArray.map((record: any) => ({
              employee_id: parseInt(employeeId, 10),
              training_id: parseInt(record.typeId, 10),
              completion_date: record.completed,
              notes: record.notes || null,
              instructor: record.instructor || null,
            }));
            
            allCompletions.push(...employeeCompletions);
            employeeResults[employeeId] = { success: true, count: employeeCompletions.length };
          } else {
            // No records or format can't be processed
            employeeResults[employeeId] = { success: true, count: 0, message: "No records or unrecognized format" };
          }
        }
        
        // Implement circuit breaker pattern
        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.error(`[${requestId}] Circuit breaker triggered after ${consecutiveFailures} consecutive failures. Stopping sync.`);
          throw new Error(`Too many consecutive failures (${consecutiveFailures}). Sync aborted to prevent further issues.`);
        }
        
        // Periodically log progress
        if (i % 10 === 0 || i === employees.length - 1) {
          console.log(`[${requestId}] Progress: ${i + 1}/${employees.length} employees processed, found ${allCompletions.length} total completions so far`);
        }
      } catch (error) {
        console.error(`[${requestId}] Error processing employee ${employeeId}:`, error);
        failedEmployees.push({ id: employeeId, error: error instanceof Error ? error.message : String(error) });
        employeeResults[employeeId] = { success: false, error: error instanceof Error ? error.message : String(error) };
        // Continue with next employee on error
      }
    }
    
    console.log(`[${requestId}] Found ${allCompletions.length} total training completions`);
    console.log(`[${requestId}] Failed to process ${failedEmployees.length} employees`);
    
    // 3. Save the completions to the database
    const { inserted, errors, errorDetails } = await saveTrainingCompletions(allCompletions, requestId);
    
    // 4. Update sync status to success
    const finalStatus = errors > 0 ? 'partial_success' : 'success';
    const errorMessage = errors > 0 
      ? `Completed with errors: ${errors} failures out of ${inserted + errors} records. Failed employees: ${failedEmployees.length}`
      : null;
      
    const { error: updateError } = await supabase
      .from('sync_status')
      .update({ 
        status: finalStatus, 
        last_sync: new Date().toISOString(),
        error: errorMessage,
        updated_at: new Date().toISOString(),
        details: {
          version: FUNCTION_VERSION,
          deploymentId: DEPLOYMENT_ID,
          errors: errorDetails,
          failedEmployees: failedEmployees.slice(0, 50), // Limit to first 50 to avoid overflow
          employeeResults: Object.keys(employeeResults).length > 100 ? 
            { message: "Too many results to display", count: Object.keys(employeeResults).length } : 
            employeeResults
        }
      })
      .eq('id', 'training_completions');
    
    if (updateError) {
      console.error(`[${requestId}] Error updating final sync status:`, updateError);
    }
    
    return {
      success: true,
      status: finalStatus,
      message: `Sync completed: ${inserted} completions inserted, ${errors} errors, ${failedEmployees.length} failed employees`,
      total_completions: allCompletions.length,
      inserted,
      errors,
      function_version: FUNCTION_VERSION,
      deployment_id: DEPLOYMENT_ID
    };
  } catch (error) {
    console.error(`[${requestId}] Error syncing training completions:`, error);
    
    // Update sync status to error
    const { error: updateError } = await supabase
      .from('sync_status')
      .update({ 
        status: 'error', 
        error: error instanceof Error ? error.message : "Unknown error",
        updated_at: new Date().toISOString(),
        details: {
          version: FUNCTION_VERSION,
          deploymentId: DEPLOYMENT_ID,
          error: error instanceof Error ? error.stack : "No stack trace available"
        }
      })
      .eq('id', 'training_completions');
    
    if (updateError) {
      console.error(`[${requestId}] Error updating error sync status:`, updateError);
    }
    
    return {
      success: false,
      message: `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error",
      function_version: FUNCTION_VERSION,
      deployment_id: DEPLOYMENT_ID
    };
  }
}

async function getVersionInfo() {
  return {
    function_name: "sync-training-completions",
    version: FUNCTION_VERSION,
    deployment_timestamp: DEPLOYMENT_TIMESTAMP,
    deployment_id: DEPLOYMENT_ID,
    environment: {
      supabase_url: supabaseUrl ? "configured" : "missing",
      bamboo_subdomain: bambooSubdomain ? "configured" : "missing",
      supabase_key: supabaseKey ? "configured" : "missing",
      bamboo_api_key: bambooApiKey ? "configured" : "missing"
    }
  };
}

serve(async (req) => {
  const requestId = generateRequestId();
  console.log(`[${requestId}] Received request: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log(`[${requestId}] Handling CORS preflight request`);
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  // Version check endpoint - use this to verify which version is deployed
  const url = new URL(req.url);
  if (url.pathname.endsWith('/version')) {
    console.log(`[${requestId}] Version information requested`);
    return new Response(JSON.stringify(await getVersionInfo()), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
  
  try {
    // Log request details for debugging
    console.log(`[${requestId}] Request URL: ${req.url}`);
    console.log(`[${requestId}] Request headers:`, logAuthHeaders(req.headers));
    
    // Verify authentication - comprehensive approach
    const authHeader = req.headers.get('Authorization');
    const apiKey = req.headers.get('apikey');
    
    // Debug log the auth information we received
    console.log(`[${requestId}] Auth header present: ${!!authHeader}`);
    console.log(`[${requestId}] API key header present: ${!!apiKey}`);
    
    // Check both authorization methods and provide detailed error messages
    if (!authHeader && !apiKey) {
      console.error(`[${requestId}] Authentication error: Both Authorization and apikey headers are missing`);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Missing authentication. Both Authorization header and apikey are missing.",
          version: FUNCTION_VERSION,
          deployment_id: DEPLOYMENT_ID
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }
    
    // Log authentication method being used
    if (authHeader) {
      console.log(`[${requestId}] Using Authorization header authentication`);
    } else if (apiKey) {
      console.log(`[${requestId}] Using apikey header authentication`);
    }
    
    // Start the sync process
    console.log(`[${requestId}] Training completions sync started - authentication successful`);
    const result = await syncTrainingCompletions(requestId);
    
    // Return success response
    return new Response(JSON.stringify({
      ...result,
      request_id: requestId,
      version: FUNCTION_VERSION,
      deployment_id: DEPLOYMENT_ID
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`[${requestId}] Unhandled error in edge function:`, error);
    
    // Return error response
    return new Response(JSON.stringify({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
      request_id: requestId,
      version: FUNCTION_VERSION,
      deployment_id: DEPLOYMENT_ID
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

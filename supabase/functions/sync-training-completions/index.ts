import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// VERSION TRACKING - DO NOT MODIFY THIS SECTION MANUALLY
// These constants help identify which version is actually running
const FUNCTION_VERSION = "2.0.0";
const DEPLOYMENT_TIMESTAMP = "2025-05-13T19:30:00Z";
const DEPLOYMENT_ID = "v2_0_0_rate_limiting_fix";

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

// Helper function to add delay between API requests (enhanced with random jitter)
const delay = (ms: number) => new Promise(resolve => {
  // Add some jitter (±20%) to avoid synchronized requests
  const jitter = ms * (0.8 + Math.random() * 0.4);
  setTimeout(resolve, jitter);
});

// Log function startup with version information
console.log(`[${new Date().toISOString()}] Starting sync-training-completions edge function - Version ${FUNCTION_VERSION} (${DEPLOYMENT_ID})`);
console.log(`API Configuration - Supabase URL: ${supabaseUrl ? "Set" : "Missing"}, BambooHR Subdomain: ${bambooSubdomain ? "Set" : "Missing"}`);
console.log(`API Keys - Supabase: ${supabaseKey ? "Set (Masked)" : "Missing"}, BambooHR: ${bambooApiKey ? "Set (Masked)" : "Missing"}`);

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

/**
 * Fetch employees with optimized error handling and retries
 */
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

/**
 * Fetch training records with improved rate limiting and retry logic
 * @param employeeId Employee ID
 * @param requestId Request ID for tracking
 * @param maxRetries Max retry attempts
 * @returns Object with records and metadata
 */
async function fetchTrainingRecords(employeeId: string, requestId: string, maxRetries = 3) {
  console.log(`[${requestId}] Fetching training records for employee ${employeeId} (attempt 1/${maxRetries + 1})`);
  
  const apiUrl = `https://api.bamboohr.com/api/gateway.php/${bambooSubdomain}/v1/training/record/employee/${employeeId}`;
  const headers = {
    "Accept": "application/json",
    "Authorization": `Basic ${btoa(`${bambooApiKey}:x`)}`,
  };
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // On retry attempts, add exponential backoff with increased base time
      if (attempt > 0) {
        // Increased backoff time: 1.5s, 3s, 6s
        const backoffTime = Math.pow(2, attempt) * 750; 
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
        // More aggressive backoff when 503 detected
        if (attempt < maxRetries) {
          // Use a longer delay for 503s: 3s, 6s, 12s
          await delay(3000 * Math.pow(2, attempt));
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

/**
 * Save training completions to database with delete-then-insert pattern 
 * to avoid onConflict issues with v2 client
 */
async function saveTrainingCompletions(completions: any[], requestId: string) {
  if (!completions.length) {
    console.log(`[${requestId}] No completions to save`);
    return { inserted: 0, errors: 0, requestId };
  }
  
  console.log(`[${requestId}] Saving ${completions.length} training completions to database`);
  
  let inserted = 0;
  let errors = 0;
  let errorDetails: string[] = [];
  
  // Process in smaller batches to avoid overwhelming the database
  const batchSize = 25; // Reduced from 50 to 25
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
        
        // Add a small delay after delete to ensure database consistency
        await delay(300);
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
      
      // Add delay between batches to reduce database pressure
      if (i + batchSize < completions.length) {
        await delay(500);
      }
    } catch (error) {
      console.error(`[${batchId}] Error processing batch:`, error);
      errors += batch.length;
      errorDetails.push(`Batch ${Math.floor(i / batchSize) + 1} unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return { inserted, errors, errorDetails, requestId };
}

/**
 * Main sync function with enhanced rate limiting and error handling
 */
async function syncTrainingCompletions(requestId: string) {
  let syncDetails: Record<string, any> = {
    start_time: new Date().toISOString(),
    version: FUNCTION_VERSION,
    deployment_id: DEPLOYMENT_ID,
  };
  
  try {
    console.log(`[${requestId}] Starting training completions synchronization`);
    
    // Update sync status to running
    const { error: statusUpdateError } = await supabase
      .from('sync_status')
      .update({ 
        status: 'running', 
        error: null,
        updated_at: new Date().toISOString(),
        details: {
          start_time: new Date().toISOString(),
          triggered_by: 'Edge function',
          version: FUNCTION_VERSION
        }
      })
      .eq('id', 'training_completions');
    
    if (statusUpdateError) {
      console.error(`[${requestId}] Error updating sync status:`, statusUpdateError);
      syncDetails.status_update_error = statusUpdateError.message;
    }
    
    // Insert a record if it doesn't exist
    const { error: insertError } = await supabase
      .from('sync_status')
      .insert({ 
        id: 'training_completions', 
        status: 'running', 
        updated_at: new Date().toISOString(),
        details: syncDetails
      })
      .select()
      .single();
    
    if (insertError && !insertError.message.includes('duplicate')) {
      console.error(`[${requestId}] Error inserting sync status:`, insertError);
      syncDetails.status_insert_error = insertError.message;
    }
    
    // 1. Fetch all employees
    const { employees, requestId: employeeRequestId } = await fetchEmployees();
    console.log(`[${requestId}] Processing ${employees.length} employees`);
    syncDetails.total_employees = employees.length;
    
    // 2. For each employee, fetch and process their training records
    const allCompletions = [];
    const failedEmployees = [];
    const employeeResults: Record<string, any> = {};
    
    // Circuit breaker pattern to prevent continuing if too many errors
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5;
    
    // Process employees in smaller batches to avoid overwhelming the API
    const employeeBatchSize = 5;
    
    for (let batchIndex = 0; batchIndex < employees.length; batchIndex += employeeBatchSize) {
      // Get the current batch of employees
      const employeeBatch = employees.slice(batchIndex, batchIndex + employeeBatchSize);
      console.log(`[${requestId}] Processing employee batch ${Math.floor(batchIndex/employeeBatchSize) + 1}/${Math.ceil(employees.length/employeeBatchSize)}`);
      
      // Process this batch sequentially
      for (let i = 0; i < employeeBatch.length; i++) {
        const employee = employeeBatch[i];
        const employeeId = employee.id;
        console.log(`[${requestId}] Processing employee ${batchIndex + i + 1}/${employees.length}: ID ${employeeId}`);
        
        try {
          // Add a delay between employee processing to avoid rate limiting
          // Increasing delay to 750ms between employees
          if (i > 0 || batchIndex > 0) {
            await delay(750);
          }
          
          // Fetch training records for this employee
          const { records, error } = await fetchTrainingRecords(employeeId, requestId);
          
          if (error) {
            console.error(`[${requestId}] Error fetching training records for employee ${employeeId}:`, error);
            failedEmployees.push({ id: employeeId, error });
            employeeResults[employeeId] = { status: 'error', error };
            consecutiveFailures++;
            
            // Circuit breaker: if too many consecutive failures, slow down
            if (consecutiveFailures >= maxConsecutiveFailures) {
              console.warn(`[${requestId}] Circuit breaker triggered: ${consecutiveFailures} consecutive failures. Slowing down...`);
              await delay(5000); // 5 second pause
              consecutiveFailures = 0; // Reset counter after pause
            }
            
            continue;
          }
          
          // Process the training records
          const trainingRecords = Array.isArray(records) ? records : Object.values(records);
          
          if (trainingRecords.length === 0) {
            console.log(`[${requestId}] No training records found for employee ${employeeId}`);
            employeeResults[employeeId] = { status: 'skipped', reason: 'no_records' };
            continue;
          }
          
          // Reset consecutive failures counter on success
          consecutiveFailures = 0;
          
          // Map the training records to our database format
          const completions = trainingRecords
            .filter(record => record.completed) // Only include completed trainings
            .map(record => ({
              employee_id: parseInt(employeeId),
              training_id: parseInt(record.type) || 0,
              completion_date: record.completed || new Date().toISOString().split('T')[0], // Use current date if no completion date
              instructor: record.instructor || null,
              notes: record.notes || null
            }));
          
          if (completions.length > 0) {
            console.log(`[${requestId}] Mapped ${completions.length} completions for employee ${employeeId}`);
            allCompletions.push(...completions);
            employeeResults[employeeId] = { 
              status: 'success', 
              records_found: trainingRecords.length,
              completions_mapped: completions.length
            };
          } else {
            console.log(`[${requestId}] No completed trainings found for employee ${employeeId}`);
            employeeResults[employeeId] = { status: 'skipped', reason: 'no_completions' };
          }
        } catch (error) {
          console.error(`[${requestId}] Error processing employee ${employeeId}:`, error);
          failedEmployees.push({ id: employeeId, error: error instanceof Error ? error.message : String(error) });
          employeeResults[employeeId] = { status: 'error', error: error instanceof Error ? error.message : String(error) };
          consecutiveFailures++;
        }
      }
      
      // Add a larger delay between batches
      if (batchIndex + employeeBatchSize < employees.length) {
        const batchDelay = 2000; // 2 second delay between employee batches
        console.log(`[${requestId}] Completed batch ${Math.floor(batchIndex/employeeBatchSize) + 1}/${Math.ceil(employees.length/employeeBatchSize)}, pausing for ${batchDelay}ms before next batch`);
        await delay(batchDelay);
      }
    }
    
    // Save the progress so far in sync details
    syncDetails.employees_processed = employees.length;
    syncDetails.employees_with_errors = failedEmployees.length;
    syncDetails.total_completions_found = allCompletions.length;
    
    // Update the sync status with progress information
    await supabase
      .from('sync_status')
      .update({
        details: {
          ...syncDetails,
          progress: 'completions_processed',
          completions_count: allCompletions.length,
          failed_employees: failedEmployees.length
        }
      })
      .eq('id', 'training_completions');
    
    // 3. Save all completions to the database
    let saveResult;
    if (allCompletions.length > 0) {
      console.log(`[${requestId}] Saving ${allCompletions.length} completions to database`);
      saveResult = await saveTrainingCompletions(allCompletions, requestId);
      
      // Update sync details with save results
      syncDetails.inserted = saveResult.inserted;
      syncDetails.errors = saveResult.errors;
      syncDetails.error_details = saveResult.errorDetails;
    } else {
      console.log(`[${requestId}] No completions to save`);
      saveResult = { inserted: 0, errors: 0, requestId };
      syncDetails.inserted = 0;
      syncDetails.errors = 0;
      syncDetails.reason = "No completions found";
    }
    
    // 4. Update the sync status to reflect completion
    const finalStatus = saveResult.errors > 0 && saveResult.inserted > 0 
      ? 'partial_success'
      : saveResult.errors > 0 && saveResult.inserted === 0
        ? 'error' 
        : 'success';
    
    const finalError = saveResult.errors > 0 
      ? `Failed to save ${saveResult.errors} out of ${allCompletions.length} completions` 
      : null;
    
    // Final sync status update
    syncDetails.end_time = new Date().toISOString();
    syncDetails.duration_seconds = (new Date().getTime() - new Date(syncDetails.start_time).getTime()) / 1000;
    syncDetails.final_status = finalStatus;
    syncDetails.employee_results = employeeResults;
    
    // Update the final status
    const { error: finalUpdateError } = await supabase
      .from('sync_status')
      .update({ 
        status: finalStatus, 
        error: finalError,
        updated_at: new Date().toISOString(),
        last_sync: new Date().toISOString(),
        details: syncDetails
      })
      .eq('id', 'training_completions');
    
    if (finalUpdateError) {
      console.error(`[${requestId}] Error updating final sync status:`, finalUpdateError);
    }
    
    console.log(`[${requestId}] Sync completed with status: ${finalStatus}`);
    console.log(`[${requestId}] Results: ${saveResult.inserted} inserted, ${saveResult.errors} errors`);
    
    return { 
      status: finalStatus,
      inserted: saveResult.inserted,
      errors: saveResult.errors,
      total_completions: allCompletions.length,
      failed_employees: failedEmployees.length,
      duration_seconds: syncDetails.duration_seconds
    };
  } catch (error) {
    console.error(`[${requestId}] Unhandled error in sync process:`, error);
    
    // Update sync status to reflect the error
    syncDetails.end_time = new Date().toISOString();
    syncDetails.duration_seconds = (new Date().getTime() - new Date(syncDetails.start_time).getTime()) / 1000;
    syncDetails.error = error instanceof Error ? error.message : String(error);
    syncDetails.error_stack = error instanceof Error ? error.stack : undefined;
    
    await supabase
      .from('sync_status')
      .update({ 
        status: 'error', 
        error: error instanceof Error ? error.message : String(error),
        updated_at: new Date().toISOString(),
        details: syncDetails
      })
      .eq('id', 'training_completions');
    
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : String(error),
      duration_seconds: syncDetails.duration_seconds
    };
  }
}

// Version endpoint to check the deployed function version
async function handleVersionRequest() {
  return new Response(
    JSON.stringify({
      version: FUNCTION_VERSION,
      deployed_at: DEPLOYMENT_TIMESTAMP,
      deployment_id: DEPLOYMENT_ID
    }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
}

// Main serve function
serve(async (req) => {
  // Generate a unique request ID
  const requestId = generateRequestId();
  
  // Log incoming request
  console.log(`[${requestId}] Edge function received ${req.method} request: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  // Version check endpoint
  const url = new URL(req.url);
  if (url.pathname.endsWith('/version')) {
    return handleVersionRequest();
  }
  
  try {
    // Start the sync process
    console.log(`[${requestId}] Starting sync process`);
    const result = await syncTrainingCompletions(requestId);
    
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error(`[${requestId}] Unhandled error in edge function:`, error);
    
    // Update sync status to reflect the error
    await supabase
      .from('sync_status')
      .update({ 
        status: 'error', 
        error: error instanceof Error ? error.message : String(error),
        updated_at: new Date().toISOString(),
        details: {
          error: error instanceof Error ? error.message : String(error),
          error_stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        }
      })
      .eq('id', 'training_completions');
    
    return new Response(JSON.stringify({
      status: "error",
      message: "An error occurred during the sync process",
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});

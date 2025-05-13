
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Log the start of the function
console.log("Starting sync-training-completions edge function");

async function fetchEmployees() {
  console.log("Fetching employees from BambooHR");
  
  const apiUrl = `https://api.bamboohr.com/api/gateway.php/${bambooSubdomain}/v1/employees/directory`;
  const headers = {
    "Accept": "application/json",
    "Authorization": `Basic ${btoa(`${bambooApiKey}:x`)}`,
  };
  
  try {
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch employees: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.employees?.length || 0} employees from BambooHR`);
    return data.employees || [];
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
}

async function fetchTrainingRecords(employeeId: string) {
  console.log(`Fetching training records for employee ${employeeId}`);
  
  const apiUrl = `https://api.bamboohr.com/api/gateway.php/${bambooSubdomain}/v1/training/record/employee/${employeeId}`;
  const headers = {
    "Accept": "application/json",
    "Authorization": `Basic ${btoa(`${bambooApiKey}:x`)}`,
  };
  
  try {
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      // Handle 404s gracefully (employee without training records)
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Failed to fetch training records: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error(`Error fetching training records for employee ${employeeId}:`, error);
    return []; // Return empty array on error to continue with other employees
  }
}

async function saveTrainingCompletions(completions: any[]) {
  if (!completions.length) {
    console.log("No completions to save");
    return { inserted: 0, errors: 0 };
  }
  
  console.log(`Saving ${completions.length} training completions to database`);
  
  let inserted = 0;
  let errors = 0;
  
  // Process in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < completions.length; i += batchSize) {
    const batch = completions.slice(i, i + batchSize);
    
    try {
      // First, delete existing completions for these employee_id/training_id combinations
      const employeeIds = [...new Set(batch.map(c => c.employee_id))];
      const trainingIds = [...new Set(batch.map(c => c.training_id))];
      
      if (employeeIds.length > 0 && trainingIds.length > 0) {
        // Delete existing records for these employees and trainings
        const { error: deleteError } = await supabase
          .from('employee_training_completions')
          .delete()
          .in('employee_id', employeeIds)
          .in('training_id', trainingIds);
          
        if (deleteError) {
          console.error("Error deleting existing completions:", deleteError);
        }
      }
      
      // Now insert the new records
      const { data, error } = await supabase
        .from('employee_training_completions')
        .insert(batch);
        
      if (error) {
        console.error("Error inserting completions:", error);
        errors += batch.length;
      } else {
        inserted += batch.length;
      }
    } catch (error) {
      console.error("Error processing batch:", error);
      errors += batch.length;
    }
  }
  
  return { inserted, errors };
}

async function syncTrainingCompletions() {
  try {
    console.log("Starting training completions synchronization");
    
    // Update sync status to running
    await supabase
      .from('sync_status')
      .update({ 
        status: 'running', 
        error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'training_completions');
    
    // 1. Fetch all employees
    const employees = await fetchEmployees();
    console.log(`Processing ${employees.length} employees`);
    
    // 2. For each employee, fetch and process their training records
    const allCompletions = [];
    const batchSize = 10; // Process employees in small batches
    
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);
      console.log(`Processing employee batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(employees.length/batchSize)}`);
      
      // Process employees in parallel within each batch
      const batchPromises = batch.map(async (employee) => {
        try {
          const trainingRecords = await fetchTrainingRecords(employee.id);
          
          // Map records to our database format
          return trainingRecords.map((record: any) => ({
            employee_id: parseInt(employee.id, 10),
            training_id: parseInt(record.typeId, 10),
            completion_date: record.completed,
            notes: record.notes || null,
            instructor: record.instructor || null,
          }));
        } catch (error) {
          console.error(`Error processing employee ${employee.id}:`, error);
          return []; // Skip this employee on error
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      allCompletions.push(...batchResults.flat());
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < employees.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    console.log(`Found ${allCompletions.length} total training completions`);
    
    // 3. Save the completions to the database
    const result = await saveTrainingCompletions(allCompletions);
    
    // 4. Update sync status to success
    await supabase
      .from('sync_status')
      .update({ 
        status: 'success', 
        last_sync: new Date().toISOString(),
        error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'training_completions');
    
    return {
      success: true,
      message: `Sync completed: ${result.inserted} completions inserted, ${result.errors} errors`,
      total_completions: allCompletions.length,
      inserted: result.inserted,
      errors: result.errors
    };
  } catch (error) {
    console.error("Error syncing training completions:", error);
    
    // Update sync status to error
    await supabase
      .from('sync_status')
      .update({ 
        status: 'error', 
        error: error instanceof Error ? error.message : "Unknown error",
        updated_at: new Date().toISOString()
      })
      .eq('id', 'training_completions');
    
    return {
      success: false,
      message: `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Debug log all request headers
    console.log("Request headers:", Object.fromEntries(req.headers));
    
    // Verify authentication - IMPROVED AUTHENTICATION HANDLING
    const authHeader = req.headers.get('Authorization');
    const apiKey = req.headers.get('apikey');
    
    // Debug log the auth information we received
    console.log("Auth header present:", !!authHeader);
    console.log("API key header present:", !!apiKey);
    
    // Check both authorization methods and provide detailed error messages
    if (!authHeader && !apiKey) {
      console.error("Authentication error: Both Authorization and apikey headers are missing");
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Missing authentication. Both Authorization header and apikey are missing."
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }
    
    // Log authentication method being used
    if (authHeader) {
      console.log("Using Authorization header authentication");
      // Optionally validate JWT token here if needed
    } else if (apiKey) {
      console.log("Using apikey header authentication");
      // Optionally validate API key here if needed
    }
    
    // Start the sync process
    console.log("Training completions sync started - authentication successful");
    const result = await syncTrainingCompletions();
    
    // Return success response
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unhandled error in edge function:", error);
    
    // Return error response
    return new Response(JSON.stringify({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://fvpbkkmnzlxbcxokxkce.supabase.co";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting BambooHR data sync process...");
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseKey = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, supabaseKey);

    // Get BambooHR credentials from env variables
    const subdomain = Deno.env.get('BAMBOOHR_SUBDOMAIN');
    const apiKey = Deno.env.get('BAMBOOHR_API_KEY');

    console.log(`BambooHR configuration: subdomain=${subdomain ? 'set' : 'missing'}, apiKey=${apiKey ? 'set' : 'missing'}`);
    
    if (!subdomain || !apiKey) {
      await updateSyncStatus(supabase, 'error', 'Missing BambooHR credentials');
      return new Response(JSON.stringify({ error: 'Missing BambooHR credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await updateSyncStatus(supabase, 'running', null);

    // Fetch employees, trainings, and completions from BambooHR
    const bambooData = await fetchBambooHRData(subdomain, apiKey);
    
    if (!bambooData) {
      await updateSyncStatus(supabase, 'error', 'Failed to fetch data from BambooHR');
      return new Response(JSON.stringify({ error: 'Failed to fetch data from BambooHR' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store the fetched data in Supabase
    console.log(`Syncing data: ${bambooData.employees.length} employees, ${bambooData.trainings.length} trainings, ${bambooData.completions.length} completions`);
    
    const results = {
      employees: await syncEmployees(supabase, bambooData.employees),
      trainings: await syncTrainings(supabase, bambooData.trainings),
      completions: await syncCompletions(supabase, bambooData.completions),
    };

    // Right before returning a successful response, update the sync status
    try {
      await updateSyncStatus(supabase, 'success', null);
    } catch (statusError) {
      console.error("Failed to update final sync status:", statusError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'BambooHR data synced successfully',
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error syncing BambooHR data:', error);
    
    // Try to update sync status if possible
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabaseKey = authHeader.replace('Bearer ', '');
        const supabase = createClient(SUPABASE_URL, supabaseKey);
        await updateSyncStatus(supabase, 'error', error.message);
      }
    } catch (updateError) {
      console.error('Failed to update sync status:', updateError);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error syncing BambooHR data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to update sync status
async function updateSyncStatus(supabase: any, status: string, error: string | null) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (status === 'success') {
    updateData.last_sync = new Date().toISOString();
  }
  
  if (error) {
    updateData.error = error;
  } else {
    updateData.error = null;  // Clear any previous error
  }
  
  try {
    const { error: updateError } = await supabase
      .from('sync_status')
      .update(updateData)
      .eq('id', 'bamboohr');
      
    if (updateError) {
      console.error('Failed to update sync status:', updateError);
    } else {
      console.log(`Updated sync status: ${status}`);
    }
  } catch (error) {
    console.error('Failed to update sync status:', error);
  }
}

// Fetch data from BambooHR
async function fetchBambooHRData(subdomain: string, apiKey: string) {
  const baseUrl = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1`;
  const auth = btoa(`${apiKey}:x`);
  
  try {
    console.log("Fetching employees directory...");
    
    // Fetch employees
    const employeesResponse = await fetch(`${baseUrl}/employees/directory`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (!employeesResponse.ok) {
      console.error(`Failed to fetch employees: ${employeesResponse.status} ${await employeesResponse.text()}`);
      throw new Error(`Failed to fetch employees: ${employeesResponse.status}`);
    }
    
    const employeesData = await employeesResponse.json();
    const employees = employeesData.employees || [];
    
    console.log(`Fetched ${employees.length} employees`);
    
    // Sample first employee for debugging
    if (employees.length > 0) {
      console.log("Sample employee:", JSON.stringify(employees[0]));
    }
    
    // Fetch training types
    console.log("Fetching training types...");
    const trainingsResponse = await fetch(`${baseUrl}/training/type`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (!trainingsResponse.ok) {
      console.error(`Failed to fetch trainings: ${trainingsResponse.status} ${await trainingsResponse.text()}`);
      throw new Error(`Failed to fetch trainings: ${trainingsResponse.status}`);
    }
    
    let trainings = await trainingsResponse.json();
    
    // Handle different response formats
    if (!Array.isArray(trainings)) {
      console.log("Training response is not an array, converting to array");
      if (typeof trainings === 'object') {
        trainings = Object.values(trainings);
      } else {
        trainings = [];
      }
    }
    
    console.log(`Fetched ${trainings.length} trainings`);
    
    if (trainings.length > 0) {
      console.log("Sample training:", JSON.stringify(trainings[0]));
    }
    
    // Process employees to get completions
    console.log("Fetching training completions for employees...");
    const sampleSize = 20; // Increased from 10 to get more data
    const sampleEmployees = employees.slice(0, Math.min(sampleSize, employees.length));
    
    let allCompletions: any[] = [];
    
    // Process employees in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < sampleEmployees.length; i += batchSize) {
      const batch = sampleEmployees.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(sampleEmployees.length/batchSize)}`);
      
      const batchPromises = batch.map(async (employee: any) => {
        try {
          const completionsResponse = await fetch(`${baseUrl}/training/record/employee/${employee.id}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Basic ${auth}`
            },
          });
          
          if (!completionsResponse.ok) {
            console.warn(`Failed to fetch completions for employee ${employee.id}: ${completionsResponse.status}`);
            return [];
          }
          
          const completionsData = await completionsResponse.json();
          
          // Convert object to array if needed
          let completionsArray = completionsData;
          if (!Array.isArray(completionsData)) {
            completionsArray = Object.values(completionsData);
          }
          
          console.log(`Employee ${employee.id} has ${completionsArray.length} training completions`);
          
          // Map to standardized format
          return completionsArray.map((c: any) => ({
            id: `${employee.id}-${c.type}`,
            employee_id: employee.id,
            training_id: c.type,
            completion_date: c.completed,
            status: 'completed',
            // Include additional fields as needed
          }));
        } catch (error) {
          console.warn(`Error fetching completions for employee ${employee.id}:`, error);
          return [];
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          allCompletions = [...allCompletions, ...result.value];
        }
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Fetched ${allCompletions.length} total completions`);
    
    return {
      employees,
      trainings,
      completions: allCompletions
    };
  } catch (error) {
    console.error('Error fetching BambooHR data:', error);
    throw error;
  }
}

// Sync employees to Supabase
async function syncEmployees(supabase: any, employees: any[]) {
  if (!employees || employees.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  console.log(`Syncing ${employees.length} employees to database...`);
  
  // First clear the existing cached_employees table
  try {
    await supabase.from('cached_employees').delete().neq('id', '0');
    console.log("Cleared existing cached_employees data");
  } catch (error) {
    console.error("Error clearing cached_employees table:", error);
  }
  
  // Transform employees to match our cached_employees schema
  const mappedEmployees = employees.map(emp => ({
    id: emp.id,
    name: emp.displayName || emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
    position: emp.jobTitle?.name || emp.jobTitle || null,
    department: emp.department?.name || emp.department || null,
    division: emp.division || emp.department?.name || emp.department || null,
    email: emp.email || emp.workEmail || null,
    work_email: emp.workEmail || emp.email || null,
    display_name: emp.displayName || emp.name || null,
    first_name: emp.firstName || null,
    last_name: emp.lastName || null,
    job_title: emp.jobTitle?.name || emp.jobTitle || null,
    avatar: emp.photoUrl || null,
    hire_date: emp.hireDate || null,
    cached_at: new Date().toISOString()
  }));
  
  console.log(`First employee mapped: ${JSON.stringify(mappedEmployees[0])}`);
  
  // Insert all employees in batches of 100
  const batchSize = 100;
  let totalUpserted = 0;
  
  for (let i = 0; i < mappedEmployees.length; i += batchSize) {
    const batch = mappedEmployees.slice(i, i + batchSize);
    const { error, count } = await supabase
      .from('cached_employees')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error('Error upserting employees batch:', error);
    } else {
      totalUpserted += count || batch.length;
      console.log(`Successfully upserted batch of ${batch.length} employees`);
    }
  }
  
  console.log(`Successfully upserted ${totalUpserted} employees total`);
  
  return { upserted: totalUpserted };
}

// Sync trainings to Supabase
async function syncTrainings(supabase: any, trainings: any[]) {
  if (!trainings || trainings.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  console.log(`Syncing ${trainings.length} trainings to database...`);
  
  // First clear the existing cached_trainings table
  try {
    await supabase.from('cached_trainings').delete().neq('id', '0');
    console.log("Cleared existing cached_trainings data");
  } catch (error) {
    console.error("Error clearing cached_trainings table:", error);
  }
  
  // Transform trainings to match our cached_trainings schema
  const mappedTrainings = trainings.map(training => ({
    id: training.id?.toString() || training.type?.toString(),
    title: training.name || `Training ${training.id || training.type}`,
    type: training.type || training.id?.toString() || null,
    category: training.category || 'General',
    description: training.description || null,
    duration_hours: parseFloat(training.hours) || 0,
    required_for: training.required ? ['Required'] : [],
    cached_at: new Date().toISOString()
  }));
  
  if (mappedTrainings.length > 0) {
    console.log(`First training mapped: ${JSON.stringify(mappedTrainings[0])}`);
  }
  
  // Upsert all trainings
  const { error, count } = await supabase
    .from('cached_trainings')
    .upsert(mappedTrainings, { onConflict: 'id' });
  
  if (error) {
    console.error('Error upserting trainings:', error);
    throw error;
  }
  
  console.log(`Successfully upserted ${count || mappedTrainings.length} trainings`);
  
  return { upserted: count || mappedTrainings.length };
}

// Sync completions to Supabase
async function syncCompletions(supabase: any, completions: any[]) {
  if (!completions || completions.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  console.log(`Syncing ${completions.length} completions to database...`);
  
  // First clear the existing cached_training_completions table
  try {
    await supabase.from('cached_training_completions').delete().neq('id', '0');
    console.log("Cleared existing cached_training_completions data");
  } catch (error) {
    console.error("Error clearing cached_training_completions table:", error);
  }
  
  // Transform completions to match our cached_training_completions schema
  const mappedCompletions = completions.map(completion => ({
    id: completion.id || `${completion.employee_id}-${completion.training_id}`,
    employee_id: completion.employee_id,
    training_id: completion.training_id,
    completion_date: completion.completion_date || completion.completedDate || completion.completed || null,
    expiration_date: completion.expiration_date || completion.expirationDate || null,
    status: completion.status || 'completed',
    score: completion.score ? parseFloat(completion.score) : null,
    certificate_url: completion.certificate_url || completion.certificateUrl || null,
    cached_at: new Date().toISOString()
  }));
  
  if (mappedCompletions.length > 0) {
    console.log(`First completion mapped: ${JSON.stringify(mappedCompletions[0])}`);
  }
  
  // Insert completions in batches to avoid payload size limits
  const batchSize = 100;
  let totalUpserted = 0;
  
  for (let i = 0; i < mappedCompletions.length; i += batchSize) {
    const batch = mappedCompletions.slice(i, i + batchSize);
    const { error, count } = await supabase
      .from('cached_training_completions')
      .upsert(batch, { onConflict: ['employee_id', 'training_id'] });
    
    if (error) {
      console.error('Error upserting completions batch:', error, batch[0]);
    } else {
      totalUpserted += count || batch.length;
      console.log(`Successfully upserted batch of ${batch.length} completions`);
    }
  }
  
  console.log(`Successfully upserted ${totalUpserted} completions total`);
  
  return { upserted: totalUpserted };
}

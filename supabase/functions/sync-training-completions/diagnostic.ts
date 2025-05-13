
import { corsHeaders } from "./cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  // This is a CORS preflight request. We need to respond with the correct headers.
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verify database access
    const { data: syncData, error: syncError } = await supabase
      .from('sync_status')
      .select('*')
      .eq('id', 'training_completions')
      .single();

    // Get counts from tables
    const { count: trainingCompletionsCount, error: trainingCompletionsError } = await supabase
      .from('employee_training_completions')
      .select('*', { count: 'exact', head: true });
      
    const { count: cachedCompletionsCount, error: cachedCompletionsError } = await supabase
      .from('cached_training_completions')
      .select('*', { count: 'exact', head: true });

    // Check if we can call the BambooHR API (simplified check)
    const hasBambooAccess = !!Deno.env.get('BAMBOOHR_API_KEY');

    // Compile the diagnostic report
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      environmentChecks: {
        hasSyncStatusAccess: !syncError,
        hasTrainingCompletionsAccess: !trainingCompletionsError,
        hasCachedCompletionsAccess: !cachedCompletionsError,
        hasBambooHRAPIKey: hasBambooAccess,
      },
      dataCounts: {
        trainingCompletionsCount,
        cachedCompletionsCount,
      },
      syncStatus: syncData || null,
      errors: {
        syncStatusError: syncError?.message,
        trainingCompletionsError: trainingCompletionsError?.message,
        cachedCompletionsError: cachedCompletionsError?.message,
      }
    };

    return new Response(JSON.stringify(diagnosticReport), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in diagnostic endpoint:", error);
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

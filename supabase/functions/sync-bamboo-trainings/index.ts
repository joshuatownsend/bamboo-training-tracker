
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get BambooHR credentials from environment variables
    const subdomain = Deno.env.get("BAMBOOHR_SUBDOMAIN");
    const apiKey = Deno.env.get("BAMBOOHR_API_KEY");

    if (!subdomain || !apiKey) {
      throw new Error("Missing BambooHR credentials");
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching training types from BambooHR...");

    // Fetch training types from BambooHR
    const response = await fetch(
      `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/training/type`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${btoa(`${apiKey}:x`)}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`BambooHR API error: ${response.status} ${response.statusText}`);
    }

    const trainings = await response.json();
    console.log(`Retrieved ${trainings.length} training types from BambooHR`);

    // Process and upsert training types to Supabase
    const processedTrainings = trainings.map((training: any) => ({
      id: String(training.id),
      name: training.name || `Training ${training.id}`,
      category: training.category || null,
      description: training.description || null,
    }));

    console.log("Upserting training types to Supabase...");
    
    // Use upsert to either update existing records or insert new ones
    const { data, error } = await supabase
      .from("bamboo_training_types")
      .upsert(processedTrainings)
      .select();

    if (error) {
      throw error;
    }

    console.log(`Successfully synced ${processedTrainings.length} training types to Supabase`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${processedTrainings.length} training types`,
        data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error syncing training types:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});


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
      throw new Error("Missing BambooHR credentials in environment variables");
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching training types from BambooHR...");

    // Fetch training types from BambooHR with proper authentication
    const response = await fetch(
      `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/training/type`,
      {
        headers: {
          "Accept": "application/json",
          "Authorization": `Basic ${btoa(`${apiKey}:x`)}`
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BambooHR API error status:", response.status, response.statusText);
      console.error("Error details:", errorText);
      throw new Error(`BambooHR API error (${response.status}): ${errorText}`);
    }

    const trainingsData = await response.json();
    
    console.log("BambooHR response type:", typeof trainingsData);
    console.log("BambooHR response structure:", JSON.stringify(trainingsData).substring(0, 200) + "...");
    
    // Process the training data based on its format
    let trainings = [];
    
    if (typeof trainingsData === 'object' && !Array.isArray(trainingsData)) {
      // Handle object format (key-value pairs of trainings)
      trainings = Object.values(trainingsData);
      console.log(`Extracted ${trainings.length} trainings from object format`);
    } else if (Array.isArray(trainingsData)) {
      // Handle array format (direct array of trainings)
      trainings = trainingsData;
      console.log(`Found ${trainings.length} trainings in array format`);
    } else {
      console.error("Unexpected training data format:", typeof trainingsData);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Unexpected data format from BambooHR API",
          data_type: typeof trainingsData
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Process and upsert trainings only if we have data
    if (trainings.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No training types found in the BambooHR response",
          raw_data_type: typeof trainingsData
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    // Process and normalize training data for database storage
    const processedTrainings = trainings.map((training) => ({
      id: String(training.id),
      name: training.name || `Training ${training.id}`,
      category: training.category?.name || training.category || null,
      description: training.description || null,
    }));

    console.log("Upserting training types to Supabase...");
    
    // Use upsert to either update existing records or insert new ones
    const { data, error } = await supabase
      .from("bamboo_training_types")
      .upsert(processedTrainings)
      .select();

    if (error) {
      console.error("Supabase upsert error:", error);
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


// Improved BambooHR data sync function with better error handling
// This function syncs employee data from BambooHR to our database

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Console log with timestamp for better debugging
function logWithTimestamp(message: string) {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${message}`);
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    logWithTimestamp("BambooHR data sync function started");
    
    // Get credentials from environment
    const subdomain = Deno.env.get('BAMBOOHR_SUBDOMAIN');
    const apiKey = Deno.env.get('BAMBOOHR_API_KEY');
    
    // Check if credentials are available
    if (!subdomain || !apiKey) {
      logWithTimestamp("Missing BambooHR credentials");
      throw new Error("BambooHR credentials not properly configured");
    }

    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logWithTimestamp("Missing Supabase credentials");
      throw new Error("Supabase credentials not properly configured");
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch employee data from BambooHR
    logWithTimestamp("Fetching employee data from BambooHR");
    
    // Construct the BambooHR API URLs
    const baseUrl = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1`;
    
    // Fields to fetch from BambooHR
    const fields = [
      'id', 'firstName', 'lastName', 'workEmail', 'jobTitle', 
      'department', 'division', 'hireDate', 'photoUrl'
    ];
    
    // Construct directory endpoint
    const directoryUrl = `${baseUrl}/employees/directory`;
    
    // Build custom report URL properly
    let customReportUrl = `${baseUrl}/reports/custom?format=json`;
    customReportUrl += `&fields=${encodeURIComponent(JSON.stringify(fields))}`;
    
    logWithTimestamp(`Fetching employee directory from: ${directoryUrl}`);
    logWithTimestamp(`Fetching custom report from: ${customReportUrl}`);
    
    // Authentication headers
    const authHeader = `Basic ${btoa(apiKey + ':x')}`;
    const headers = {
      'Accept': 'application/json',
      'Authorization': authHeader
    };
    
    // Function to handle fetch requests with retries
    async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url, { headers });
          
          if (!response.ok) {
            const errorText = await response.text();
            logWithTimestamp(`BambooHR API error (${response.status}): ${errorText}`);
            
            // Special handling for 404 errors
            if (response.status === 404) {
              logWithTimestamp(`Resource not found at URL: ${url}`);
              return null; // Return null for 404s instead of retrying
            }
            
            throw new Error(`BambooHR API error (${response.status}): ${errorText}`);
          }
          
          return await response.json();
        } catch (error) {
          if (attempt === retries) throw error;
          logWithTimestamp(`Retry ${attempt + 1}/${retries} after error: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
      return null;
    }
    
    // Fetch data in parallel for efficiency
    const [directoryData, customReportData] = await Promise.all([
      fetchWithRetry(directoryUrl),
      fetchWithRetry(customReportUrl)
    ]);
    
    // Process and merge the data
    const employees = [];
    
    if (!directoryData || !directoryData.employees || directoryData.employees.length === 0) {
      logWithTimestamp("No employees found in directory");
    } else {
      logWithTimestamp(`Found ${directoryData.employees.length} employees in directory`);
      
      // Map directory data
      for (const emp of directoryData.employees) {
        employees.push({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          name: `${emp.firstName} ${emp.lastName}`,
          email: emp.workEmail || '',
          workEmail: emp.workEmail || '',
          jobTitle: emp.jobTitle || '',
          department: emp.department || '',
          division: emp.division || '',
          displayName: `${emp.firstName} ${emp.lastName}`,
          position: emp.jobTitle || '',
          avatar: emp.photoUrl || ''
        });
      }
    }
    
    // Add any additional details from custom report
    if (customReportData && Array.isArray(customReportData.employees)) {
      logWithTimestamp(`Found ${customReportData.employees.length} employees in custom report`);
      
      // Update employees with additional data from custom report
      for (const reportEmp of customReportData.employees) {
        const existingEmp = employees.find(e => e.id === reportEmp.id);
        if (existingEmp) {
          // Update with custom report data
          existingEmp.hireDate = reportEmp.hireDate || existingEmp.hireDate;
          // Add other fields as needed
        } else {
          // Add employee if not in directory
          employees.push({
            id: reportEmp.id,
            firstName: reportEmp.firstName,
            lastName: reportEmp.lastName,
            name: `${reportEmp.firstName} ${reportEmp.lastName}`,
            email: reportEmp.workEmail || '',
            workEmail: reportEmp.workEmail || '',
            jobTitle: reportEmp.jobTitle || '',
            department: reportEmp.department || '',
            division: reportEmp.division || '',
            displayName: `${reportEmp.firstName} ${reportEmp.lastName}`,
            position: reportEmp.jobTitle || '',
            hireDate: reportEmp.hireDate || '',
            avatar: reportEmp.photoUrl || ''
          });
        }
      }
    }
    
    // Store the data in the database
    if (employees.length > 0) {
      // Clear existing cached employees
      logWithTimestamp("Clearing existing cached employees");
      const { error: clearError } = await supabase
        .from('cached_employees')
        .delete()
        .neq('id', '0'); // Dummy condition to delete all
      
      if (clearError) {
        logWithTimestamp(`Error clearing cached employees: ${clearError.message}`);
        throw new Error(`Error clearing cached employees: ${clearError.message}`);
      }
      
      // Insert new cached employees
      logWithTimestamp(`Inserting ${employees.length} cached employees`);
      const { error: insertError } = await supabase
        .from('cached_employees')
        .insert(employees);
      
      if (insertError) {
        logWithTimestamp(`Error inserting cached employees: ${insertError.message}`);
        throw new Error(`Error inserting cached employees: ${insertError.message}`);
      }
    }
    
    // Update sync status
    const { error: updateError } = await supabase
      .from('sync_status')
      .update({ 
        status: 'success', 
        error: null,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', 'bamboohr');
    
    if (updateError) {
      logWithTimestamp(`Error updating sync status: ${updateError.message}`);
      // Continue even if status update fails
    }
    
    logWithTimestamp("BambooHR data sync completed successfully");
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "BambooHR data sync completed successfully",
        employeesCount: employees.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    logWithTimestamp(`Error in BambooHR data sync: ${error.message}`);
    
    try {
      // Get Supabase credentials 
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Update sync status to show error
        await supabase
          .from('sync_status')
          .update({ 
            status: 'error', 
            error: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', 'bamboohr');
      }
    } catch (dbError) {
      logWithTimestamp(`Failed to update error status: ${dbError.message}`);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});

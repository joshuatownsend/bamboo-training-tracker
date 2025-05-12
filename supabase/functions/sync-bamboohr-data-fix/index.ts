
// Improved BambooHR data sync function with better error handling and URL encoding fixes
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
    
    // Construct the BambooHR API URL manually to avoid URL encoding issues
    const baseUrl = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1`;
    
    // FIX: Properly construct URL for custom report
    // Fields to fetch from BambooHR
    const fields = [
      'id', 'firstName', 'lastName', 'workEmail', 'jobTitle', 
      'department', 'division', 'hireDate', 'photoUrl'
    ];
    
    // Construct directory endpoint - this has no query parameters so it's simple
    const directoryUrl = `${baseUrl}/employees/directory`;
    
    // Fix: Build custom report URL properly with encoded parameters
    // First build the base URL without query string
    let customReportUrl = `${baseUrl}/reports/custom`;
    
    // Then add query parameters manually to ensure proper formatting
    const customReportParams = new URLSearchParams();
    customReportParams.append('format', 'json');
    
    // Fix: Encode the JSON fields parameter properly
    const fieldsJson = JSON.stringify(fields);
    customReportParams.append('fields', fieldsJson);
    
    // Append the query string to the URL
    customReportUrl += `?${customReportParams.toString()}`;
    
    logWithTimestamp(`Fetching employee directory from: ${directoryUrl}`);
    logWithTimestamp(`Fetching custom report from: ${customReportUrl}`);
    
    // Authentication headers
    const authHeader = `Basic ${btoa(apiKey + ':x')}`;
    
    // Function to handle fetch requests with retries
    async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Authorization': authHeader
            }
          });
          
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
          
          const data = await response.json();
          return data;
        } catch (error) {
          if (attempt === retries) throw error;
          logWithTimestamp(`Retry ${attempt + 1}/${retries} after error: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
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
      
      // Map directory data - FIXED: Using snake_case field names to match database schema
      for (const emp of directoryData.employees) {
        employees.push({
          id: emp.id,
          first_name: emp.firstName,
          last_name: emp.lastName,
          name: `${emp.firstName} ${emp.lastName}`,
          email: emp.workEmail || '',
          work_email: emp.workEmail || '',
          job_title: emp.jobTitle || '',
          department: emp.department || '',
          division: emp.division || '',
          display_name: `${emp.firstName} ${emp.lastName}`,
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
          // Update with custom report data - FIXED: Using snake_case field names
          existingEmp.hire_date = reportEmp.hireDate || existingEmp.hire_date;
          // Add other fields as needed
        } else {
          // Add employee if not in directory - FIXED: Using snake_case field names
          employees.push({
            id: reportEmp.id,
            first_name: reportEmp.firstName,
            last_name: reportEmp.lastName,
            name: `${reportEmp.firstName} ${reportEmp.lastName}`,
            email: reportEmp.workEmail || '',
            work_email: reportEmp.workEmail || '',
            job_title: reportEmp.jobTitle || '',
            department: reportEmp.department || '',
            division: reportEmp.division || '',
            display_name: `${reportEmp.firstName} ${reportEmp.lastName}`,
            position: reportEmp.jobTitle || '',
            hire_date: reportEmp.hireDate || '',
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

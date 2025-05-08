
import { BambooHRClient } from './client';

/**
 * Tests various BambooHR API endpoints to determine which ones are available
 * for the given credentials. This helps diagnose API structure differences
 * between different BambooHR accounts.
 */
export async function testBambooHREndpoints(client: BambooHRClient) {
  const endpoints = [
    // Meta endpoints (structural data)
    '/meta/fields',
    '/meta/lists',
    '/meta/tables',
    '/meta/users',
    
    // Employee data endpoints
    '/employees/directory',
    '/employees',
    
    // Custom tables that might contain training data
    '/employees/all/tables/training',
    '/employees/all/tables/trainingCompleted',
    '/employees/all/tables/certifications',
    
    // Time off data
    '/meta/time_off/types',
    
    // Company data
    '/company/photo',
  ];

  // Update the type definition to include the data property
  const results: {endpoint: string, exists: boolean, error?: string, data?: any}[] = [];
  
  console.log('Testing BambooHR API endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      // First try a HEAD request to check if the endpoint exists
      const exists = await client.testEndpointExists(endpoint);
      
      results.push({
        endpoint,
        exists
      });
      
      // If it exists, try to fetch data
      if (exists) {
        try {
          const data = await client.fetchFromBamboo(endpoint);
          console.log(`Endpoint ${endpoint} exists and returned data:`, data);
          
          // Add detail about what was returned
          results[results.length - 1].data = {
            type: typeof data,
            isArray: Array.isArray(data),
            keys: data ? Object.keys(data) : [],
            isEmpty: !data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)
          };
        } catch (dataError) {
          console.error(`Endpoint ${endpoint} exists but fetch failed:`, dataError);
          results[results.length - 1].error = dataError instanceof Error ? dataError.message : String(dataError);
        }
      } else {
        console.log(`Endpoint ${endpoint} does not exist or is not accessible`);
      }
    } catch (error) {
      console.error(`Error testing endpoint ${endpoint}:`, error);
      results.push({
        endpoint,
        exists: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  console.log('BambooHR API endpoint test results:', results);
  
  return {
    results,
    accessibleEndpoints: results.filter(r => r.exists).map(r => r.endpoint),
    recommendations: generateRecommendations(results)
  };
}

function generateRecommendations(results: any[]) {
  const accessibleEndpoints = results.filter(r => r.exists);
  
  if (accessibleEndpoints.length === 0) {
    return [
      "No endpoints are accessible. This likely means the API key is invalid or doesn't have sufficient permissions.",
      "Try generating a new API key in BambooHR with admin permissions.",
      "Verify the subdomain is correct and doesn't include '.bamboohr.com'."
    ];
  }
  
  const recommendations: string[] = [
    `${accessibleEndpoints.length} of ${results.length} endpoints are accessible.`
  ];
  
  // Check if we have access to employee data
  const hasEmployeeData = accessibleEndpoints.some(r => 
    r.endpoint.includes('/employees') && (!r.data?.isEmpty)
  );
  
  if (hasEmployeeData) {
    recommendations.push("Employee data is accessible. Basic functionality should work.");
  } else {
    recommendations.push("Employee data appears to be inaccessible. Check API key permissions.");
  }
  
  // Check if we have access to training data
  const hasTrainingData = accessibleEndpoints.some(r => 
    r.endpoint.includes('training') || r.endpoint.includes('certifications')
  );
  
  if (hasTrainingData) {
    recommendations.push("Training/certification data appears to be accessible.");
  } else {
    recommendations.push("No training data endpoints found. Your BambooHR instance might use a different structure for training records.");
  }
  
  return recommendations;
}

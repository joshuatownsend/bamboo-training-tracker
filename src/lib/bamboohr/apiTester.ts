
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
  const results: {endpoint: string, exists: boolean, error?: string, data?: any, responseType?: string}[] = [];
  
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
          const response = await client.fetchRawResponse(endpoint);
          const contentType = response.headers.get('content-type') || '';
          const isJson = contentType.includes('application/json');
          const isHtml = contentType.includes('text/html');
          
          results[results.length - 1].responseType = contentType;
          
          if (isJson) {
            // It's JSON, parse it
            const data = await response.json();
            console.log(`Endpoint ${endpoint} exists and returned JSON data:`, data);
            
            // Add detail about what was returned
            results[results.length - 1].data = {
              type: typeof data,
              isArray: Array.isArray(data),
              keys: data ? Object.keys(data) : [],
              isEmpty: !data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)
            };
          } else if (isHtml) {
            // It's HTML, extract useful information
            const text = await response.text();
            console.error(`Endpoint ${endpoint} returned HTML instead of JSON`);
            
            // Look for title or specific patterns in HTML that might help diagnose
            const titleMatch = text.match(/<title>(.*?)<\/title>/);
            const title = titleMatch ? titleMatch[1] : 'Unknown HTML Page';
            
            results[results.length - 1].error = `Returned HTML page "${title}" instead of JSON. This indicates an authentication issue.`;
            results[results.length - 1].data = {
              type: 'html',
              title,
              isLoginPage: text.includes('login') || title.toLowerCase().includes('login'),
              isErrorPage: text.includes('error') || title.toLowerCase().includes('error')
            };
          } else {
            // It's something else
            const text = await response.text();
            console.error(`Endpoint ${endpoint} returned non-JSON data:`, text.substring(0, 100));
            results[results.length - 1].error = `Returned non-JSON response (${contentType})`;
            results[results.length - 1].data = {
              type: 'unknown',
              preview: text.substring(0, 200)
            };
          }
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
  
  // Check if we're getting HTML responses
  const htmlResponses = results.filter(r => 
    r.data?.type === 'html' || 
    (r.error && (r.error.includes('HTML') || r.error.includes('login page')))
  );
  
  if (htmlResponses.length > 0) {
    return [
      `Receiving HTML pages instead of JSON data. This indicates authentication issues.`,
      `This usually means one of the following:`,
      `1. The subdomain "${client['subdomain'] || 'unknown'}" might be incorrect - confirm your BambooHR URL`,
      `2. Your API key might be invalid or expired - generate a new one in BambooHR`,
      `3. Your API key may not have sufficient permissions - check with your BambooHR admin`,
      `4. Try using the company name instead of the subdomain if you've been using the subdomain`
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

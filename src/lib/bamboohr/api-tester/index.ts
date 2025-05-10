
import { BambooHRClient } from '../client/base';
import { EndpointTestResult, ApiTestResults } from './types';
import { generateRecommendations } from './recommendations';

/**
 * Tests various BambooHR API endpoints to determine which ones are available
 * for the given credentials. This helps diagnose API structure differences
 * between different BambooHR accounts.
 */
export async function testBambooHREndpoints(client: BambooHRClient): Promise<ApiTestResults> {
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
  const results: EndpointTestResult[] = [];
  
  console.log('Testing BambooHR API endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      
      // Try a GET request to get full response details
      try {
        const response = await client.fetchRawResponse(endpoint);
        const contentType = response.headers.get('content-type') || '';
        const status = response.status;
        
        console.log(`Endpoint ${endpoint} response: status=${status}, contentType=${contentType}`);
        
        // Determine if endpoint exists (anything other than 404 means it exists in some form)
        const exists = status !== 404;
        
        results.push({
          endpoint,
          exists,
          status,
          responseType: contentType
        });
        
        // If it exists and returned success, try to fetch data
        if (exists) {
          try {
            const isJson = contentType.includes('application/json');
            const isHtml = contentType.includes('text/html');
            
            if (isJson) {
              // It's JSON, parse it
              const text = await response.text();
              try {
                const data = JSON.parse(text);
                console.log(`Endpoint ${endpoint} exists and returned JSON data:`, data);
                
                // Add detail about what was returned
                results[results.length - 1].data = {
                  type: typeof data,
                  isArray: Array.isArray(data),
                  keys: data ? (Array.isArray(data) ? ['array'] : Object.keys(data)) : [],
                  isEmpty: !data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)
                };
              } catch (jsonError) {
                console.error(`Failed to parse JSON for ${endpoint}:`, jsonError);
                results[results.length - 1].error = `Invalid JSON response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`;
              }
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
                isLoginPage: text.includes('login') || title.toLowerCase().includes('login') || 
                            text.includes('password') || text.includes('sign in'),
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
          console.log(`Endpoint ${endpoint} does not exist or is not accessible (status ${status})`);
        }
      } catch (responseError) {
        console.error(`Error fetching endpoint ${endpoint}:`, responseError);
        results.push({
          endpoint,
          exists: false,
          error: responseError instanceof Error ? responseError.message : String(responseError)
        });
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

// Re-export types
export * from './types';

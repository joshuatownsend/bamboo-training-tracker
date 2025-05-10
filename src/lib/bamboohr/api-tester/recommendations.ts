
import { EndpointTestResult } from './types';

/**
 * Generate recommendations based on the API testing results
 */
export function generateRecommendations(results: EndpointTestResult[]): string[] {
  const accessibleEndpoints = results.filter(r => r.exists);
  
  if (accessibleEndpoints.length === 0) {
    return [
      "No endpoints are accessible. This likely means the API key is invalid or doesn't have sufficient permissions.",
      "Try generating a new API key in BambooHR with admin permissions.",
      "Verify the subdomain is correct and doesn't include '.bamboohr.com'."
    ];
  }
  
  // Check for authentication issues
  const authIssues = results.filter(r => 
    r.status === 401 || r.status === 403 || 
    (r.data?.type === 'html' && r.data?.isLoginPage) ||
    (r.error && (r.error.includes('authentication') || r.error.includes('login')))
  );
  
  if (authIssues.length > 0) {
    return [
      `Found ${authIssues.length} endpoints with authentication issues.`,
      `This indicates your API key may be invalid or has insufficient permissions.`,
      `Try generating a new API key in BambooHR with admin permissions.`,
      `Make sure the API key and subdomain are correctly set in Supabase Functions secrets.`
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
      `1. The subdomain might be incorrect - confirm your BambooHR URL`,
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

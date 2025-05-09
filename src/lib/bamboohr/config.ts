
/**
 * Configuration for BambooHR API integration
 */

// Get configuration from environment or localStorage
export const getBambooConfig = () => {
  // First try localStorage (for user-configured settings)
  const subdomain = localStorage.getItem('bamboohr_subdomain');
  const apiKey = localStorage.getItem('bamboohr_apiKey');
  const useEdgeFunction = localStorage.getItem('bamboohr_useEdgeFunction') === 'false' ? false : true;
  
  return {
    subdomain: subdomain || 'avfrd', // Default to avfrd if not specified
    apiKey: apiKey || '',
    useEdgeFunction: useEdgeFunction, // Default to true for edge function
    // Use the Edge Function URL from environment or a default
    edgeFunctionUrl: 'https://fvpbkkmnzlxbcxokxkce.supabase.co/functions/v1/bamboohr',
  };
};

// Check if BambooHR is configured
export const isBambooConfigured = () => {
  const config = getBambooConfig();
  
  // If we're using Edge Function, we only need to check that flag
  // as the credentials are stored on the server
  if (config.useEdgeFunction) {
    return true;
  }
  
  // Otherwise, check that we have both subdomain and API key
  return !!(config.subdomain && config.apiKey);
};

// Get effective configuration (for client use)
export const getEffectiveBambooConfig = () => {
  const config = getBambooConfig();
  
  // If Edge Function is enabled, ensure we have the URL
  if (config.useEdgeFunction && !config.edgeFunctionUrl) {
    console.error('Edge Function URL is missing');
  }
  
  return config;
};

// Set the useEdgeFunction flag
export const setUseEdgeFunction = (useEdgeFunction: boolean): void => {
  localStorage.setItem('bamboohr_useEdgeFunction', useEdgeFunction.toString());
  console.log('BambooHR Edge Function setting updated:', useEdgeFunction);
};

// Store a subdomain locally for better UX in diagnostic pages
export const storeSubdomainLocally = (subdomain: string): void => {
  if (subdomain) {
    localStorage.setItem('bamboo_subdomain', subdomain);
    console.log('BambooHR subdomain stored locally for reference:', subdomain);
  }
};

// Get the locally stored subdomain (for UI reference only)
export const getLocalSubdomain = (): string => {
  return localStorage.getItem('bamboo_subdomain') || 'avfrd';
};

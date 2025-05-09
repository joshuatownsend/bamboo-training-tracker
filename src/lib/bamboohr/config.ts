/**
 * Configuration for BambooHR API integration
 */

// Get configuration from environment or localStorage
export const getBambooConfig = () => {
  // First try localStorage (for user-configured settings)
  const subdomain = localStorage.getItem('bamboohr_subdomain');
  const apiKey = localStorage.getItem('bamboohr_apiKey');
  const useEdgeFunction = localStorage.getItem('bamboohr_useEdgeFunction') === 'true';
  
  // Legacy property - keeping for backward compatibility
  const useProxy = localStorage.getItem('bamboohr_use_proxy') === 'true';
  
  return {
    subdomain: subdomain || '',
    apiKey: apiKey || '',
    useEdgeFunction: useEdgeFunction,
    useProxy: useProxy,
    // Use the Edge Function URL from environment or a default
    edgeFunctionUrl: 'https://fvpbkkmnzlxbcxokxkce.supabase.co/functions/v1',
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

// Set the useProxy flag in localStorage (legacy)
export const setUseProxyFlag = (useProxy: boolean): void => {
  localStorage.setItem('bamboohr_use_proxy', useProxy.toString());
  console.log('BambooHR proxy setting updated:', useProxy);
};

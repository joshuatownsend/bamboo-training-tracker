
export const BAMBOO_HR_CONFIG = {
  subdomain: import.meta.env.VITE_BAMBOO_SUBDOMAIN || '',
  apiKey: import.meta.env.VITE_BAMBOO_API_KEY || '',
  useEdgeFunction: true,
  edgeFunctionUrl: import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || ''
};

// Check if BambooHR is properly configured
export const isBambooConfigured = (): boolean => {
  // When using Edge Function, we don't need local config
  if (BAMBOO_HR_CONFIG.useEdgeFunction && BAMBOO_HR_CONFIG.edgeFunctionUrl) {
    console.log('BambooHR configured to use Edge Function:', BAMBOO_HR_CONFIG.edgeFunctionUrl);
    return true;
  }
  
  // Check both environment variables and localStorage (legacy approach)
  const envConfigured = Boolean(BAMBOO_HR_CONFIG.subdomain && BAMBOO_HR_CONFIG.apiKey);
  const localStorageConfigured = Boolean(
    localStorage.getItem('bamboo_subdomain') && 
    localStorage.getItem('bamboo_api_key')
  );
  
  const isConfigured = envConfigured || localStorageConfigured;
  console.log('BambooHR configuration check result:', isConfigured ? 'Configured' : 'Not configured');
  console.log('  - Environment variables configured:', envConfigured);
  console.log('  - LocalStorage configured:', localStorageConfigured);
  
  return isConfigured;
};

// Get effective configuration (combining env vars and localStorage)
export const getEffectiveBambooConfig = () => {
  // When using Edge Function, return Edge Function config
  if (BAMBOO_HR_CONFIG.useEdgeFunction) {
    return {
      subdomain: 'managed-by-edge-function',
      apiKey: 'managed-by-edge-function',
      useEdgeFunction: true,
      edgeFunctionUrl: BAMBOO_HR_CONFIG.edgeFunctionUrl || import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || ''
    };
  }
  
  // Legacy approach (direct API connection)
  const storedSubdomain = localStorage.getItem('bamboo_subdomain');
  const storedApiKey = localStorage.getItem('bamboo_api_key');
  const useProxyStr = localStorage.getItem('bamboo_use_proxy');
  
  // Default to using proxy if not specified
  const useProxy = useProxyStr === null ? true : useProxyStr === 'true';
  
  return {
    subdomain: storedSubdomain || BAMBOO_HR_CONFIG.subdomain,
    apiKey: storedApiKey || BAMBOO_HR_CONFIG.apiKey,
    useProxy,
    useEdgeFunction: false
  };
};

// Set the useEdgeFunction flag
export const setUseEdgeFunction = (useEdgeFunction: boolean): void => {
  localStorage.setItem('bamboo_use_edge_function', useEdgeFunction.toString());
  console.log('BambooHR Edge Function setting updated:', useEdgeFunction);
};

// Set the useProxy flag in localStorage (legacy)
export const setUseProxyFlag = (useProxy: boolean): void => {
  localStorage.setItem('bamboo_use_proxy', useProxy.toString());
  console.log('BambooHR proxy setting updated:', useProxy);
};

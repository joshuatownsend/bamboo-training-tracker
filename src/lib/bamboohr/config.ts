
export const BAMBOO_HR_CONFIG = {
  subdomain: import.meta.env.VITE_BAMBOO_SUBDOMAIN || '',
  apiKey: import.meta.env.VITE_BAMBOO_API_KEY || ''
};

// Check if BambooHR is properly configured
export const isBambooConfigured = (): boolean => {
  // Check both environment variables and localStorage
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
  const storedSubdomain = localStorage.getItem('bamboo_subdomain');
  const storedApiKey = localStorage.getItem('bamboo_api_key');
  
  return {
    subdomain: storedSubdomain || BAMBOO_HR_CONFIG.subdomain,
    apiKey: storedApiKey || BAMBOO_HR_CONFIG.apiKey
  };
};

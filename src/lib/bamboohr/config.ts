
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
  
  return envConfigured || localStorageConfigured;
};

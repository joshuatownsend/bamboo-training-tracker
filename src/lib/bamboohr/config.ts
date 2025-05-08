
export const BAMBOO_HR_CONFIG = {
  subdomain: import.meta.env.VITE_BAMBOO_SUBDOMAIN || '',
  apiKey: import.meta.env.VITE_BAMBOO_API_KEY || ''
};

// Check if BambooHR is properly configured
export const isBambooConfigured = (): boolean => {
  return Boolean(BAMBOO_HR_CONFIG.subdomain && BAMBOO_HR_CONFIG.apiKey);
};

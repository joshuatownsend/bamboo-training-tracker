
// Default admin configuration - will be used if no settings are found
export const LOCAL_STORAGE_KEY = "avfrd_admin_settings";

export const DEFAULT_ADMIN_CONFIGURATION = {
  // Admin email addresses that should have administrator privileges
  adminEmails: [
    'admin@avfrd.org', 
    'chief@avfrd.org',
    'president@avfrd.org',
    'training@avfrd.org',
    'jtownsend@avfrd.net'
  ],
  // Azure AD groups that grant admin access (group IDs or names)
  adminGroups: [
    'training-portal-admins',
    'training-committee'
  ]
};

// Helper function to load admin settings from localStorage
export const loadAdminSettings = () => {
  try {
    const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    // Initialize settings if none exist
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_CONFIGURATION));
    return DEFAULT_ADMIN_CONFIGURATION;
  } catch (error) {
    console.error("Error loading admin settings:", error);
    // In case of error, use default settings
    return DEFAULT_ADMIN_CONFIGURATION;
  }
};

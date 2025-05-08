
// Microsoft Authentication Library configuration
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "YOUR_CLIENT_ID_HERE",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "common"}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    // The following settings are critical for SPA authentication
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

// Scopes for login requests
export const loginRequest = {
  scopes: ["User.Read"],
};

// Optional: Add BambooHR API scopes if available for your tenant
export const bambooHRApiRequest = {
  scopes: ["api://bamboohr-integration/user_data.read"],
};

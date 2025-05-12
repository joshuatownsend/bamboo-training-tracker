
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  PublicClientApplication, 
  EventType,
  EventMessage, 
  AuthenticationResult,
  AccountInfo
} from '@azure/msal-browser';
import { msalConfig } from '../lib/authConfig';

// Create the MSAL instance outside the component
// This ensures it's only created once and properly initialized
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL immediately
(async () => {
  try {
    await msalInstance.initialize();
    console.log("MSAL initialized successfully");
    
    // Handle the redirect promise in case this page loads after a redirect
    await msalInstance.handleRedirectPromise();
  } catch (error) {
    console.error("Error initializing MSAL:", error);
  }
})();

// Register event callbacks
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS) {
    console.log("Login successful");
  }
  if (event.eventType === EventType.LOGIN_FAILURE) {
    console.error("Login failed:", event.error);
  }
  if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
    console.log("Token acquired successfully");
  }
  if (event.eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
    console.error("Failed to acquire token:", event.error);
  }
});

// Define context type
type MsalContextType = {
  instance: PublicClientApplication;
  accounts: AccountInfo[];
  isAuthenticated: boolean;
  currentAccount: AccountInfo | null;
  inProgress: boolean;
  error: Error | null;
};

// Create the context with default values
const MsalContext = createContext<MsalContextType>({
  instance: msalInstance,
  accounts: [],
  isAuthenticated: false,
  currentAccount: null,
  inProgress: true,
  error: null,
});

// Hook for consuming the context
export const useMsal = () => {
  const context = useContext(MsalContext);
  if (!context) {
    throw new Error('useMsal must be used within MsalProvider');
  }
  return context;
};

// Provider component
export const MsalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [currentAccount, setCurrentAccount] = useState<AccountInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inProgress, setInProgress] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Ensure MSAL is initialized
        if (!msalInstance.getAllAccounts) {
          console.log("MSAL not fully initialized yet, waiting...");
          return;
        }

        // Check if we have accounts
        const currentAccounts = msalInstance.getAllAccounts();
        setAccounts(currentAccounts);
        
        if (currentAccounts.length > 0) {
          setCurrentAccount(currentAccounts[0]);
          setIsAuthenticated(true);
        }

        setInProgress(false);
      } catch (err) {
        console.error("Error during MSAL initialization in provider:", err);
        setError(err instanceof Error ? err : new Error('Unknown authentication error'));
        setInProgress(false);
      }
    };

    initializeAuth();

    // Set up event callbacks for account changes
    const callbackId = msalInstance.addEventCallback((event: EventMessage) => {
      if (
        event.eventType === EventType.LOGIN_SUCCESS ||
        event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS || 
        event.eventType === EventType.SSO_SILENT_SUCCESS
      ) {
        const currentAccounts = msalInstance.getAllAccounts();
        setAccounts(currentAccounts);
        
        if (currentAccounts.length > 0) {
          setCurrentAccount(currentAccounts[0]);
          setIsAuthenticated(true);
        }
      }
    });

    return () => {
      if (callbackId) {
        msalInstance.removeEventCallback(callbackId);
      }
    };
  }, []);

  const contextValue: MsalContextType = {
    instance: msalInstance,
    accounts,
    isAuthenticated,
    currentAccount,
    inProgress,
    error,
  };

  return (
    <MsalContext.Provider value={contextValue}>
      {children}
    </MsalContext.Provider>
  );
};

export default MsalContext;

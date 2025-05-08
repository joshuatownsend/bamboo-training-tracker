
import React, { createContext, useContext } from 'react';
import { PublicClientApplication, EventType, AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from '../lib/authConfig';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Set up default account selection after page load
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const result = event.payload as AuthenticationResult;
    msalInstance.setActiveAccount(result.account);
  }
});

// Custom MSAL context for easier access to common functions
export interface MsalContextType {
  instance: PublicClientApplication;
  activeAccount: AccountInfo | null;
}

export const MsalCustomContext = createContext<MsalContextType | null>(null);

export const useMsal = () => {
  const context = useContext(MsalCustomContext);
  if (!context) {
    throw new Error('useMsal must be used within a MsalContextProvider');
  }
  return context;
};

interface MsalContextProviderProps {
  children: React.ReactNode;
}

export const MsalContextProvider: React.FC<MsalContextProviderProps> = ({ children }) => {
  // Check if there's already an active account
  const activeAccount = msalInstance.getActiveAccount();

  return (
    <MsalProvider instance={msalInstance}>
      <MsalCustomContext.Provider value={{ instance: msalInstance, activeAccount }}>
        {children}
      </MsalCustomContext.Provider>
    </MsalProvider>
  );
};

export default MsalContextProvider;

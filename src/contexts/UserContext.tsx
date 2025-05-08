import React, { createContext, useContext, useState, useEffect } from "react";
import { useMsal } from "./MsalContext";
import { loginRequest } from "../lib/authConfig";
import { InteractionType, PopupRequest, RedirectRequest, AuthenticationResult, AccountInfo } from "@azure/msal-browser";
import { useMsalAuthentication } from "@azure/msal-react";
import { User } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";

// Define the admin configuration - these can be easily updated
const ADMIN_CONFIGURATION = {
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

interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance, activeAccount } = useMsal();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert MSAL account to our User type
  const mapAccountToUser = (account: AccountInfo): User => {
    // Determine user role based on email or group membership
    let role: 'user' | 'admin' = 'user';
    
    // Check if user is an admin based on their email
    if (ADMIN_CONFIGURATION.adminEmails.includes(account.username.toLowerCase())) {
      role = 'admin';
    }
    
    // Also check for admin group membership in token claims
    const groups = account.idTokenClaims?.groups as string[] | undefined;
    if (groups && groups.some(group => ADMIN_CONFIGURATION.adminGroups.includes(group))) {
      role = 'admin';
    }

    return {
      id: account.localAccountId,
      name: account.name || "Unknown User",
      email: account.username,
      role: role,
      employeeId: account.localAccountId // Can be replaced with actual employee ID from BambooHR API call
    };
  };

  // Attempt silent token acquisition and user data fetch on mount
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        if (activeAccount) {
          // We already have an account, convert it to our User type
          const user = mapAccountToUser(activeAccount);
          setCurrentUser(user);
          
          // Notify the user of their role (just for demonstration)
          toast({
            title: "Welcome back",
            description: `Logged in as ${user.name} (${user.role === 'admin' ? 'Administrator' : 'User'})`,
          });
        } else {
          // Try silent token acquisition if we have SSO or cached credentials
          const accounts = instance.getAllAccounts();
          if (accounts.length > 0) {
            try {
              // Set active account to the first one
              instance.setActiveAccount(accounts[0]);
              setCurrentUser(mapAccountToUser(accounts[0]));
            } catch (error) {
              // Silent token acquisition failed
              console.log("Silent token acquisition failed");
              setCurrentUser(null);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [instance, activeAccount]);

  // Interactive login - use redirect for better SPA compatibility
  const login = async () => {
    setIsLoading(true);
    try {
      // Try silent authentication first
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        try {
          instance.setActiveAccount(accounts[0]);
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          });
          setCurrentUser(mapAccountToUser(response.account));
          return;
        } catch (error) {
          // Silent acquisition failed, fallback to redirect
          console.log("Silent acquisition failed, falling back to redirect login");
          instance.loginRedirect(loginRequest);
          return;
        }
      } else {
        // No accounts, do redirect login
        instance.loginRedirect(loginRequest);
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout the user
  const logout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    });
    setCurrentUser(null);
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <UserContext.Provider value={{ currentUser, isLoading, isAdmin, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;

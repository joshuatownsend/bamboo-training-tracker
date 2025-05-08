
import React, { createContext, useContext, useState, useEffect } from "react";
import { useMsal } from "./MsalContext";
import { loginRequest } from "../lib/authConfig";
import { InteractionType, PopupRequest, RedirectRequest, AuthenticationResult, AccountInfo } from "@azure/msal-browser";
import { useMsalAuthentication } from "@azure/msal-react";
import { User } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";

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
    // Determine user role based on email domain or membership in admin groups
    // This is a simplified example - in a real app, you might:
    // 1. Use Microsoft Graph API to check group membership
    // 2. Look up roles in your own database
    // 3. Check claims in the ID token if custom claims are configured
    
    let role: 'user' | 'admin' = 'user';
    
    // Check if user is an admin based on email
    // In a real application, you would likely use Azure AD groups or app roles
    const adminEmails = [
      'admin@avfrd.org', 
      'chief@avfrd.org',
      'president@avfrd.org',
      'training@avfrd.org'
    ];
    
    // Simple role assignment logic - look for known admin emails
    if (adminEmails.includes(account.username.toLowerCase())) {
      role = 'admin';
    }
    
    // You can also check for groups from claims if you've configured Azure AD to include them
    const groups = account.idTokenClaims?.groups as string[] | undefined;
    if (groups && (
      groups.includes('avfrd-admins') || 
      groups.includes('avfrd-officers') ||
      groups.includes('training-committee')
    )) {
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


import React, { createContext, useContext, useState, useEffect } from "react";
import { useMsal } from "./MsalContext";
import { loginRequest } from "../lib/authConfig";
import { AuthenticationResult, InteractionRequiredAuthError, AccountInfo } from "@azure/msal-browser";
import { User } from "@/lib/types";

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
    return {
      id: account.localAccountId,
      name: account.name || "Unknown User",
      email: account.username,
      role: account.username.includes("admin") ? "admin" : "user", // Simple role assignment logic - can be enhanced
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
          setCurrentUser(mapAccountToUser(activeAccount));
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

  // Interactive login
  const login = async () => {
    setIsLoading(true);
    try {
      // Try silent authentication first
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        try {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          });
          setCurrentUser(mapAccountToUser(response.account));
          return;
        } catch (error) {
          // Silent acquisition failed, fallback to popup
          if (error instanceof InteractionRequiredAuthError) {
            const response = await instance.acquireTokenPopup(loginRequest);
            setCurrentUser(mapAccountToUser(response.account));
            return;
          }
          throw error;
        }
      } else {
        // No accounts, do popup login
        const response = await instance.loginPopup(loginRequest);
        if (response) {
          setCurrentUser(mapAccountToUser(response.account));
        }
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
    instance.logoutPopup({
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


import React, { createContext, useContext, useState, useEffect } from "react";
import { useMsal } from "./MsalContext";
import { loginRequest } from "../lib/authConfig";
import { AccountInfo } from "@azure/msal-browser";
import { User } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";
import useEmployeeMapping from "@/hooks/useEmployeeMapping";
import { UserContextType, AdminSettings } from "./types/userTypes";
import { LOCAL_STORAGE_KEY, DEFAULT_ADMIN_CONFIGURATION, loadAdminSettings } from "./config/adminSettings";
import { mapAccountToUser } from "./helpers/userMappingHelper";

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
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(DEFAULT_ADMIN_CONFIGURATION);
  const { getEmployeeIdByEmail } = useEmployeeMapping();
  
  // Load admin settings from localStorage
  useEffect(() => {
    const settings = loadAdminSettings();
    setAdminSettings(settings);
  }, []);

  // Add a listener for localStorage changes (in case settings are updated in another tab)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
        try {
          setAdminSettings(JSON.parse(event.newValue));
          // If user is already logged in, update their role based on new settings
          if (activeAccount) {
            // Use async/await with an immediate function execution
            (async () => {
              const updatedUser = await mapAccountToUser(
                activeAccount, 
                JSON.parse(event.newValue), 
                getEmployeeIdByEmail
              );
              setCurrentUser(updatedUser);
            })();
          }
        } catch (error) {
          console.error("Error parsing updated admin settings:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [activeAccount, getEmployeeIdByEmail]);

  // Refresh the employee ID mapping for the current user
  const refreshEmployeeId = async (): Promise<string | null> => {
    if (!currentUser?.email) {
      return null;
    }

    try {
      const employeeId = await getEmployeeIdByEmail(currentUser.email);
      if (employeeId) {
        setCurrentUser(prev => prev ? { ...prev, employeeId } : null);
        return employeeId;
      }
      return null;
    } catch (error) {
      console.error("Error refreshing employee ID:", error);
      return null;
    }
  };

  // Attempt silent token acquisition and user data fetch on mount
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        if (activeAccount) {
          // We already have an account, convert it to our User type
          const user = await mapAccountToUser(activeAccount, adminSettings, getEmployeeIdByEmail);
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
              const user = await mapAccountToUser(accounts[0], adminSettings, getEmployeeIdByEmail);
              setCurrentUser(user);
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
  }, [instance, activeAccount, adminSettings, getEmployeeIdByEmail]);

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
          const user = await mapAccountToUser(response.account, adminSettings, getEmployeeIdByEmail);
          setCurrentUser(user);
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
    <UserContext.Provider value={{ currentUser, isLoading, isAdmin, login, logout, refreshEmployeeId }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;


import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/lib/types";

interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // For demo purposes, we'll use a mock user
  useEffect(() => {
    // Simulating loading user from local storage or API
    const mockUser: User = {
      id: "user-1",
      name: "John Doe",
      email: "john.doe@avfrd.org",
      role: "admin", // Set to "admin" for demo purposes
      employeeId: "emp-1"
    };
    
    setTimeout(() => {
      setCurrentUser(mockUser);
      setIsLoading(false);
    }, 500);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock login - in a real app this would call an API
      const mockUser: User = {
        id: "user-1",
        name: "John Doe",
        email: email,
        role: email.includes("admin") ? "admin" : "user",
        employeeId: "emp-1"
      };
      setCurrentUser(mockUser);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
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

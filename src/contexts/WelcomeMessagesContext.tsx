
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Storage key
const STORAGE_KEY = "avfrd_welcome_messages";

// Default messages
const DEFAULT_MESSAGES: string[] = [];

interface WelcomeMessagesContextType {
  messages: string[];
  setMessages: (messages: string[]) => void;
  saveMessages: (messages: string[]) => void;
}

const WelcomeMessagesContext = createContext<WelcomeMessagesContextType | undefined>(undefined);

export const WelcomeMessagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<string[]>(DEFAULT_MESSAGES);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error("Failed to parse welcome messages:", error);
      }
    }
  }, []);

  const saveMessages = (newMessages: string[]) => {
    // Filter out empty messages and limit to 3
    const filteredMessages = newMessages
      .filter(msg => msg.trim() !== '')
      .slice(0, 3);
      
    setMessages(filteredMessages);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredMessages));
  };

  return (
    <WelcomeMessagesContext.Provider value={{ messages, setMessages, saveMessages }}>
      {children}
    </WelcomeMessagesContext.Provider>
  );
};

export const useWelcomeMessages = () => {
  const context = useContext(WelcomeMessagesContext);
  if (context === undefined) {
    throw new Error("useWelcomeMessages must be used within a WelcomeMessagesProvider");
  }
  return context;
};

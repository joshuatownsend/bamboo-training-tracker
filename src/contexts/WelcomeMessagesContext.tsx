
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  message: string;
  created_at: string;
  updated_at: string;
}

interface WelcomeMessagesContextType {
  messages: string[];
  isLoading: boolean;
  error: string | null;
  saveMessages: (messages: string[]) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

const WelcomeMessagesContext = createContext<WelcomeMessagesContextType | undefined>(undefined);

export const WelcomeMessagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number>(0);

  // Define fetchMessages as a useCallback to prevent recreating it on every render
  const fetchMessages = useCallback(async () => {
    // Prevent multiple rapid fetches
    const now = Date.now();
    if (now - lastRefreshed < 5000) { // 5 second cooldown
      console.log("[WelcomeMessagesContext] Skipping refresh, last refresh was too recent");
      return;
    }
    
    setLastRefreshed(now);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("[WelcomeMessagesContext] Fetching welcome messages from database");
      
      const { data: messagesData, error } = await supabase
        .from('welcome_messages')
        .select('*')
        .order('created_at', { ascending: true });
      
      console.log("[WelcomeMessagesContext] Raw database response:", messagesData);
      
      if (error) {
        // Don't display error toast for permission issues
        if (error.code === 'PGRST116') {
          console.log("[WelcomeMessagesContext] User doesn't have permission to access welcome messages");
          setMessages([]);
          return;
        }
        
        console.error("[WelcomeMessagesContext] Error fetching messages:", error);
        setError(error.message);
        return;
      }
      
      if (!messagesData || messagesData.length === 0) {
        console.log("[WelcomeMessagesContext] No welcome messages found in database");
        setMessages([]);
        return;
      }

      // Extract only non-empty message texts
      const validMessages = messagesData
        .map((item: Message) => item.message)
        .filter((msg: string) => msg && msg.trim() !== '');
      
      console.log("[WelcomeMessagesContext] Filtered valid messages:", validMessages);
      setMessages(validMessages);
    } catch (error) {
      console.error("[WelcomeMessagesContext] Failed to fetch welcome messages:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [lastRefreshed]);

  // Load messages from the database on mount, only once
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const refreshMessages = async () => {
    console.log("[WelcomeMessagesContext] Manually refreshing welcome messages");
    await fetchMessages();
    toast({
      title: "Messages refreshed",
      description: "Welcome messages have been refreshed from the database."
    });
  };

  const saveMessages = async (newMessages: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      // Filter out empty messages
      const filteredMessages = newMessages.filter(msg => msg && msg.trim() !== '');
      console.log("[WelcomeMessagesContext] Saving filtered messages:", filteredMessages);
      
      if (filteredMessages.length === 0) {
        console.log("[WelcomeMessagesContext] No valid messages to save");
        toast({
          title: "No valid messages",
          description: "Please enter at least one non-empty message.",
          variant: "destructive"
        });
        return;
      }
      
      // Using the RPC function to clear existing messages and save new ones
      const { data, error } = await supabase.rpc(
        'update_welcome_messages',
        { messages: filteredMessages }
      );

      if (error) {
        // Handle permission issues gracefully
        if (error.code === 'PGRST116') {
          console.log("[WelcomeMessagesContext] User doesn't have permission to save welcome messages");
          toast({
            title: "Permission denied",
            description: "You don't have permission to update welcome messages.",
            variant: "destructive"
          });
          return;
        }
        
        console.error("[WelcomeMessagesContext] Error saving messages:", error);
        setError(error.message);
        toast({
          title: "Error saving messages",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log("[WelcomeMessagesContext] Save response:", data);
      
      // Update the local state with the messages
      setMessages(filteredMessages);
      
      toast({
        title: "Messages saved",
        description: "Welcome messages have been updated successfully."
      });
    } catch (error) {
      console.error("[WelcomeMessagesContext] Failed to save welcome messages:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      toast({
        title: "Error saving messages",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WelcomeMessagesContext.Provider value={{ messages, isLoading, error, saveMessages, refreshMessages }}>
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

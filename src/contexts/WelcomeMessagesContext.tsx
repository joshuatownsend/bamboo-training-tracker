
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  saveMessages: (messages: string[]) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

const WelcomeMessagesContext = createContext<WelcomeMessagesContextType | undefined>(undefined);

export const WelcomeMessagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load messages from the database on mount
  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      console.log("[WelcomeMessagesContext] Fetching welcome messages from database");
      
      // Direct query to see what's in the table - for debugging
      const { data: rawData, error: rawError } = await supabase
        .from('welcome_messages')
        .select('*');
      
      console.log("[WelcomeMessagesContext] Raw welcome_messages table data:", rawData);
      
      if (rawError) {
        console.error("[WelcomeMessagesContext] Error in raw welcome messages query:", rawError);
        throw rawError;
      }
      
      if (!rawData || rawData.length === 0) {
        console.log("[WelcomeMessagesContext] No welcome messages found in the database");
        setMessages([]);
        setIsLoading(false);
        return;
      }

      // Extract just the non-empty message texts
      const messageTexts = rawData
        .map((item: Message) => item.message || '')
        .filter((msg: string) => msg.trim() !== '');
      
      console.log("[WelcomeMessagesContext] Processed message texts:", messageTexts);
      setMessages(messageTexts);
    } catch (error) {
      console.error("[WelcomeMessagesContext] Failed to fetch welcome messages:", error);
      toast({
        title: "Error loading messages",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    try {
      // Filter out empty messages
      const filteredMessages = newMessages.filter(msg => msg.trim() !== '');
      console.log("[WelcomeMessagesContext] Saving filtered welcome messages:", filteredMessages);
      
      // Use the RPC function to update messages
      const { data, error } = await supabase.rpc(
        'update_welcome_messages',
        { messages: filteredMessages }
      );

      if (error) {
        console.error("[WelcomeMessagesContext] Error saving welcome messages:", error);
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
      
      // Fetch messages again to ensure we have the latest data
      await fetchMessages();
    } catch (error) {
      console.error("[WelcomeMessagesContext] Failed to save welcome messages:", error);
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
    <WelcomeMessagesContext.Provider value={{ messages, isLoading, saveMessages, refreshMessages }}>
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


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
      console.log("Fetching welcome messages from database");
      const { data, error } = await supabase
        .from('welcome_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching welcome messages:", error);
        toast({
          title: "Error loading welcome messages",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log("Retrieved welcome messages:", data);
      
      if (!data || data.length === 0) {
        console.log("No welcome messages found in the database");
        setMessages([]);
      } else {
        // Extract just the message texts and include empty messages as well
        const messageTexts = data.map((item: Message) => item.message);
        console.log("Processed message texts:", messageTexts);
        setMessages(messageTexts);
      }
    } catch (error) {
      console.error("Failed to parse welcome messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMessages = async () => {
    console.log("Manually refreshing welcome messages");
    await fetchMessages();
    toast({
      title: "Messages refreshed",
      description: "Welcome messages have been refreshed from the database."
    });
  };

  const saveMessages = async (newMessages: string[]) => {
    setIsLoading(true);
    try {
      console.log("Saving welcome messages:", newMessages);
      
      // First, ensure we have exactly 3 messages to save (pad with empty strings if needed)
      const messagesToSave = [...newMessages];
      while (messagesToSave.length < 3) {
        messagesToSave.push('');
      }
      
      // Limit to 3 messages if more were provided
      const finalMessages = messagesToSave.slice(0, 3);
      console.log("Final messages to save:", finalMessages);
      
      // Use the RPC function to update messages
      const { data, error } = await supabase.rpc(
        'update_welcome_messages',
        { messages: finalMessages }
      );

      if (error) {
        console.error("Error saving welcome messages:", error);
        toast({
          title: "Error saving messages",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log("Save response:", data);
      
      // Update the local state with the messages
      setMessages(finalMessages);
      
      toast({
        title: "Messages saved",
        description: "Welcome messages have been updated successfully."
      });
      
      // Fetch messages again to ensure we have the latest data
      fetchMessages();
    } catch (error) {
      console.error("Failed to save welcome messages:", error);
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

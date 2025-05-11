
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
}

const WelcomeMessagesContext = createContext<WelcomeMessagesContextType | undefined>(undefined);

export const WelcomeMessagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load messages from the database on mount
  useEffect(() => {
    async function fetchMessages() {
      try {
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

        // Extract just the message texts and filter out empty ones
        const messageTexts = data
          .map((item: Message) => item.message)
          .filter(msg => msg.trim() !== '');
        
        setMessages(messageTexts);
      } catch (error) {
        console.error("Failed to parse welcome messages:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
  }, []);

  const saveMessages = async (newMessages: string[]) => {
    setIsLoading(true);
    try {
      // Filter out empty messages
      const filteredMessages = newMessages.filter(msg => msg.trim() !== '');
      
      // Use the RPC function to update messages
      const { data, error } = await supabase.rpc(
        'update_welcome_messages',
        { messages: filteredMessages }
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
      
      // Update the local state with the filtered messages
      setMessages(filteredMessages);
      
      toast({
        title: "Messages saved",
        description: "Welcome messages have been updated successfully."
      });
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
    <WelcomeMessagesContext.Provider value={{ messages, isLoading, saveMessages }}>
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

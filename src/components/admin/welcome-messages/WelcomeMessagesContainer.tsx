
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useWelcomeMessages } from "@/contexts/WelcomeMessagesContext";
import { useToast } from "@/components/ui/use-toast";
import ErrorDisplay from "./ErrorDisplay";
import DebugInfo from "./DebugInfo";
import MessageList from "./MessageList";
import ActionButtons from "./ActionButtons";

const WelcomeMessagesContainer: React.FC = () => {
  const { messages, isLoading, saveMessages, refreshMessages } = useWelcomeMessages();
  const [editedMessages, setEditedMessages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  console.log("[WelcomeMessagesContainer] Rendered with messages from context:", messages);

  // Update local state when messages are loaded from the database
  useEffect(() => {
    console.log("[WelcomeMessagesContainer] Effect triggered with messages:", messages);
    
    try {
      if (Array.isArray(messages)) {
        // Copy the messages array or initialize with a blank one if no messages
        const initialMessages = messages.length > 0 
          ? [...messages] 
          : [''];
        
        console.log("[WelcomeMessagesContainer] Setting edited messages:", initialMessages);
        setEditedMessages(initialMessages);
        setError(null);
      } else {
        console.error("[WelcomeMessagesContainer] Invalid messages format received:", messages);
        setEditedMessages(['']);
        setError("Invalid messages format received");
      }
    } catch (err) {
      console.error("[WelcomeMessagesContainer] Error in useEffect:", err);
      setError(`Error processing messages: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [messages]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filter out completely empty messages for display purposes
      const nonEmptyMessages = editedMessages.filter(msg => msg.trim() !== '');
      
      if (nonEmptyMessages.length === 0) {
        toast({
          title: "No content",
          description: "Please add at least one message with content.",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      console.log("[WelcomeMessagesContainer] Saving messages:", nonEmptyMessages);
      await saveMessages(nonEmptyMessages);
      console.log("[WelcomeMessagesContainer] Messages saved successfully");
    } catch (error) {
      console.error("[WelcomeMessagesContainer] Error saving messages:", error);
      setError(`Error saving messages: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    const newMessages = [...editedMessages];
    newMessages[index] = value;
    setEditedMessages(newMessages);
  };

  const handleDelete = (index: number) => {
    if (editedMessages.length <= 1) {
      // If trying to delete the last message, just clear it instead
      setEditedMessages(['']);
      return;
    }
    
    const newMessages = [...editedMessages];
    newMessages.splice(index, 1);
    setEditedMessages(newMessages);
  };

  const handleAdd = () => {
    if (editedMessages.length >= 3) {
      toast({
        title: "Maximum reached",
        description: "You can only add up to 3 messages.",
        variant: "destructive"
      });
      return;
    }
    setEditedMessages([...editedMessages, ""]);
  };

  const handleRefresh = async () => {
    try {
      setError(null);
      await refreshMessages();
    } catch (error) {
      console.error("[WelcomeMessagesContainer] Error refreshing messages:", error);
      setError(`Error refreshing messages: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 mr-2" />
        <span className="text-gray-500">Loading messages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ErrorDisplay error={error} />

      <ActionButtons 
        onRefresh={handleRefresh}
        onAdd={handleAdd}
        onSave={handleSave}
        isSaving={isSaving}
        maxReached={editedMessages.length >= 3}
      />
      
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground mb-4">
          Add up to 3 messages that will be displayed at the top of the Dashboard. 
          These can be welcome messages, announcements, or important reminders.
        </p>
        
        <DebugInfo 
          contextMessages={messages} 
          editedMessages={editedMessages} 
        />
        
        <MessageList 
          messages={editedMessages}
          onChange={handleChange}
          onDelete={handleDelete}
          isSaving={isSaving}
        />
      </Card>
    </div>
  );
};

export default WelcomeMessagesContainer;

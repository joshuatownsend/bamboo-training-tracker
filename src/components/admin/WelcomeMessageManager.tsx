
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useWelcomeMessages } from "@/contexts/WelcomeMessagesContext";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Save, Plus, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const WelcomeMessageManager: React.FC = () => {
  const { messages, isLoading, saveMessages, refreshMessages } = useWelcomeMessages();
  const [editedMessages, setEditedMessages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  console.log("[WelcomeMessageManager] Rendered with messages from context:", messages);

  // Update local state when messages are loaded from the database
  useEffect(() => {
    console.log("[WelcomeMessageManager] Effect triggered with messages:", messages);
    
    try {
      if (Array.isArray(messages)) {
        // Copy the messages array or initialize with a blank one if no messages
        const initialMessages = messages.length > 0 
          ? [...messages] 
          : [''];
        
        console.log("[WelcomeMessageManager] Setting edited messages:", initialMessages);
        setEditedMessages(initialMessages);
        setError(null);
      } else {
        console.error("[WelcomeMessageManager] Invalid messages format received:", messages);
        setEditedMessages(['']);
        setError("Invalid messages format received");
      }
    } catch (err) {
      console.error("[WelcomeMessageManager] Error in useEffect:", err);
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
      
      console.log("[WelcomeMessageManager] Saving messages:", nonEmptyMessages);
      await saveMessages(nonEmptyMessages);
      console.log("[WelcomeMessageManager] Messages saved successfully");
    } catch (error) {
      console.error("[WelcomeMessageManager] Error saving messages:", error);
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
      console.error("[WelcomeMessageManager] Error refreshing messages:", error);
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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Welcome Messages</h3>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            title="Refresh messages from the database"
            className="mr-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={handleAdd} disabled={editedMessages.length >= 3 || isSaving}>
            <Plus className="h-4 w-4 mr-2" />
            Add Message
          </Button>
        </div>
      </div>
      
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground mb-4">
          Add up to 3 messages that will be displayed at the top of the Dashboard. 
          These can be welcome messages, announcements, or important reminders.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-4">
          <h3 className="text-sm font-medium text-yellow-800">Debug Information</h3>
          <p className="text-xs text-yellow-700">
            Current messages in context: {JSON.stringify(messages)}
            <br />
            Edited messages: {JSON.stringify(editedMessages)}
          </p>
        </div>
        
        <div className="space-y-3">
          {editedMessages.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No messages added yet. Click "Add Message" to create one.
            </div>
          ) : (
            editedMessages.map((message, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder="Enter welcome message or announcement"
                  className="flex-1"
                  disabled={isSaving}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(index)}
                  className="text-destructive"
                  disabled={isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
      
      <Button 
        onClick={handleSave} 
        className="ml-auto"
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </>
        )}
      </Button>
    </div>
  );
};

export default WelcomeMessageManager;

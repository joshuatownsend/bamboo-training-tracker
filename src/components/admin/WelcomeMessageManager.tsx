
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useWelcomeMessages } from "@/contexts/WelcomeMessagesContext";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Save, Plus, Loader2, RefreshCw } from "lucide-react";

const WelcomeMessageManager: React.FC = () => {
  const { messages, isLoading, saveMessages, refreshMessages } = useWelcomeMessages();
  const [editedMessages, setEditedMessages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  console.log("WelcomeMessageManager rendered with messages from context:", messages);

  // Update local state when messages are loaded from the database
  useEffect(() => {
    console.log("Effect triggered with messages:", messages);
    
    if (messages && Array.isArray(messages)) {
      // Always ensure we have at least one message slot
      if (messages.length === 0) {
        console.log("No messages in context, initializing with empty message");
        setEditedMessages(['']);
      } else {
        console.log("Setting edited messages from context:", messages);
        setEditedMessages([...messages]);
      }
    } else {
      console.log("Invalid messages format, initializing with empty message");
      setEditedMessages(['']);
    }
  }, [messages]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filter out completely empty messages at the end
      let messagesToSave = [...editedMessages];
      
      // Ensure we always have at least one message slot
      if (messagesToSave.length === 0) {
        messagesToSave = [''];
      }
      
      console.log("Saving messages:", messagesToSave);
      await saveMessages(messagesToSave);
      console.log("Messages saved successfully");
    } catch (error) {
      console.error("Error saving messages:", error);
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
    const newMessages = [...editedMessages];
    newMessages.splice(index, 1);
    
    // Always keep at least one message slot
    if (newMessages.length === 0) {
      newMessages.push("");
    }
    
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
      await refreshMessages();
    } catch (error) {
      console.error("Error refreshing messages:", error);
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
        
        {editedMessages.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No messages added yet. Click "Add Message" to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {editedMessages.map((message, index) => (
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
                  disabled={isSaving || editedMessages.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
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

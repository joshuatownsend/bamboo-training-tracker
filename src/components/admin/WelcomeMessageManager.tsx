
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useWelcomeMessages } from "@/contexts/WelcomeMessagesContext";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Save, Plus } from "lucide-react";

const WelcomeMessageManager: React.FC = () => {
  const { messages, saveMessages } = useWelcomeMessages();
  const [editedMessages, setEditedMessages] = useState<string[]>([...messages]);
  const { toast } = useToast();

  const handleSave = () => {
    saveMessages(editedMessages);
    toast({
      title: "Messages saved",
      description: "Welcome messages have been updated successfully."
    });
  };

  const handleChange = (index: number, value: string) => {
    const newMessages = [...editedMessages];
    newMessages[index] = value;
    setEditedMessages(newMessages);
  };

  const handleDelete = (index: number) => {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Welcome Messages</h3>
        <Button onClick={handleAdd} disabled={editedMessages.length >= 3}>
          <Plus className="h-4 w-4 mr-2" />
          Add Message
        </Button>
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
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      <Button onClick={handleSave} className="ml-auto">
        <Save className="h-4 w-4 mr-2" />
        Save Changes
      </Button>
    </div>
  );
};

export default WelcomeMessageManager;

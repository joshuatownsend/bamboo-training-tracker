
import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Loader2, AlertCircle } from "lucide-react";
import { useWelcomeMessages } from "@/contexts/WelcomeMessagesContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const WelcomeMessages: React.FC = () => {
  const { messages, isLoading, refreshMessages } = useWelcomeMessages();
  
  console.log("[Dashboard WelcomeMessages] Rendering with messages:", messages);
  
  // Fetch messages on mount to ensure we have the latest data
  useEffect(() => {
    console.log("[Dashboard WelcomeMessages] Component mounted, refreshing messages");
    refreshMessages().catch(err => {
      console.error("[Dashboard WelcomeMessages] Error refreshing messages:", err);
    });
  }, [refreshMessages]);

  if (isLoading) {
    return (
      <Card className="border-company-yellow/30 bg-yellow-50/50 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-500 mr-2" />
            <span className="text-gray-500">Loading messages...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have messages data
  if (!Array.isArray(messages)) {
    console.error("[Dashboard WelcomeMessages] Invalid messages format:", messages);
    return (
      <Card className="border-red-300 bg-red-50/50 mb-6">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading welcome messages. Invalid data format.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Only render non-empty messages
  const validMessages = messages.filter(msg => msg && msg.trim() !== '');
  
  console.log("[Dashboard WelcomeMessages] Valid messages to display:", validMessages);
  
  if (validMessages.length === 0) {
    console.log("[Dashboard WelcomeMessages] No valid messages to display");
    return null;
  }

  return (
    <Card className="border-company-yellow/30 bg-yellow-50/50 mb-6">
      <CardContent className="pt-6">
        <div className="space-y-3">
          {validMessages.map((message, index) => (
            <div key={index} className="flex items-start gap-3">
              <Info className="h-5 w-5 text-company-yellow mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">{message}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeMessages;

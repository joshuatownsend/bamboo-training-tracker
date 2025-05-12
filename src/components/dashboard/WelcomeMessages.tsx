
import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useWelcomeMessages } from "@/contexts/WelcomeMessagesContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingState, MessagesList, ErrorDisplay } from "./welcome-messages";

const WelcomeMessages: React.FC = () => {
  const { messages, isLoading, error } = useWelcomeMessages();
  
  console.log("[Dashboard WelcomeMessages] Rendering with messages:", messages);
  
  // Removed the automatic refreshMessages call on mount that was causing the infinite loop

  if (isLoading) {
    return <LoadingState />;
  }
  
  if (error) {
    return (
      <Card className="border-red-300 bg-red-50/50 mb-6">
        <CardContent className="pt-6">
          <ErrorDisplay error={error} />
        </CardContent>
      </Card>
    );
  }

  // Check if messages is defined and is an array
  if (!Array.isArray(messages)) {
    console.error("[Dashboard WelcomeMessages] Invalid messages format:", messages);
    return (
      <Card className="border-red-300 bg-red-50/50 mb-6">
        <CardContent className="pt-6">
          <ErrorDisplay error="Error loading welcome messages. Invalid data format." />
        </CardContent>
      </Card>
    );
  }

  // Only display non-empty messages
  const validMessages = messages.filter(msg => msg && msg.trim() !== '');
  
  console.log("[Dashboard WelcomeMessages] Valid messages to display:", validMessages);
  
  if (validMessages.length === 0) {
    console.log("[Dashboard WelcomeMessages] No valid messages to display");
    return null;
  }

  return (
    <Card className="border-company-yellow/30 bg-yellow-50/50 mb-6">
      <CardContent className="pt-6">
        <MessagesList messages={validMessages} />
      </CardContent>
    </Card>
  );
};

export default WelcomeMessages;

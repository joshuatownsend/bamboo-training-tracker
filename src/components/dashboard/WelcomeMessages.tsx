
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Loader2 } from "lucide-react";
import { useWelcomeMessages } from "@/contexts/WelcomeMessagesContext";

const WelcomeMessages: React.FC = () => {
  const { messages, isLoading } = useWelcomeMessages();
  
  console.log("Dashboard WelcomeMessages rendering with messages:", messages);

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

  // Only render non-empty messages
  const validMessages = Array.isArray(messages) 
    ? messages.filter(msg => msg && msg.trim() !== '') 
    : [];
  
  if (validMessages.length === 0) {
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

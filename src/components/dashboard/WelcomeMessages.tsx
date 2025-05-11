
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

interface WelcomeMessagesProps {
  messages: string[];
}

const WelcomeMessages: React.FC<WelcomeMessagesProps> = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <Card className="border-company-yellow/30 bg-yellow-50/50 mb-6">
      <CardContent className="pt-6">
        <div className="space-y-3">
          {messages.map((message, index) => (
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

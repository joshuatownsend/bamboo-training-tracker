
import React from "react";
import { Info } from "lucide-react";

interface MessageItemProps {
  message: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  return (
    <div className="flex items-start gap-3">
      <Info className="h-5 w-5 text-company-yellow mt-0.5 flex-shrink-0" />
      <p className="text-gray-700">{message}</p>
    </div>
  );
};

export default MessageItem;

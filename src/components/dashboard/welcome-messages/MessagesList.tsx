
import React from "react";
import MessageItem from "./MessageItem";

interface MessagesListProps {
  messages: string[];
}

const MessagesList: React.FC<MessagesListProps> = ({ messages }) => {
  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <MessageItem key={index} message={message} />
      ))}
    </div>
  );
};

export default MessagesList;

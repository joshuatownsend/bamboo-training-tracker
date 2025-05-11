
import React from "react";
import MessageInput from "./MessageInput";

interface MessageListProps {
  messages: string[];
  onChange: (index: number, value: string) => void;
  onDelete: (index: number) => void;
  isSaving: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  onChange,
  onDelete,
  isSaving
}) => {
  if (messages.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No messages added yet. Click "Add Message" to create one.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <MessageInput
          key={index}
          message={message}
          index={index}
          onChange={onChange}
          onDelete={onDelete}
          disabled={isSaving}
        />
      ))}
    </div>
  );
};

export default MessageList;

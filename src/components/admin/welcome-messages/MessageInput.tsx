
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface MessageInputProps {
  message: string;
  index: number;
  onChange: (index: number, value: string) => void;
  onDelete: (index: number) => void;
  disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  message,
  index,
  onChange,
  onDelete,
  disabled
}) => {
  return (
    <div className="flex gap-2">
      <Input
        value={message}
        onChange={(e) => onChange(index, e.target.value)}
        placeholder="Enter welcome message or announcement"
        className="flex-1"
        disabled={disabled}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(index)}
        className="text-destructive"
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MessageInput;

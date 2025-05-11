
import React from "react";

interface DebugInfoProps {
  contextMessages: string[];
  editedMessages: string[];
}

const DebugInfo: React.FC<DebugInfoProps> = ({ contextMessages, editedMessages }) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-4">
      <h3 className="text-sm font-medium text-yellow-800">Debug Information</h3>
      <p className="text-xs text-yellow-700">
        Current messages in context: {JSON.stringify(contextMessages)}
        <br />
        Edited messages: {JSON.stringify(editedMessages)}
      </p>
    </div>
  );
};

export default DebugInfo;

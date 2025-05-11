
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Save, Loader2 } from "lucide-react";

interface ActionButtonsProps {
  onRefresh: () => void;
  onAdd: () => void;
  onSave: () => void;
  isSaving: boolean;
  maxReached: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onRefresh,
  onAdd,
  onSave,
  isSaving,
  maxReached
}) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Welcome Messages</h3>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            title="Refresh messages from the database"
            className="mr-2"
            disabled={isSaving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={onAdd} disabled={maxReached || isSaving}>
            <Plus className="h-4 w-4 mr-2" />
            Add Message
          </Button>
        </div>
      </div>
      
      <Button 
        onClick={onSave} 
        className="ml-auto mt-4"
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </>
        )}
      </Button>
    </>
  );
};

export default ActionButtons;

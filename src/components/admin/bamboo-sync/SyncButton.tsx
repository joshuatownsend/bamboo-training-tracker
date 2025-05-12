
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface SyncButtonProps {
  handleSync: () => void;
  isSyncing: boolean;
  syncStartTime: number | null;
  syncStatus: any;
}

export const SyncButton: React.FC<SyncButtonProps> = ({
  handleSync,
  isSyncing,
  syncStartTime,
  syncStatus
}) => {
  return (
    <>
      <Button 
        onClick={handleSync} 
        disabled={isSyncing || syncStatus?.status === 'running'}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing 
          ? syncStartTime 
            ? `Syncing... (${((performance.now() - syncStartTime) / 1000).toFixed(1)}s)` 
            : "Syncing..." 
          : "Sync Now"}
      </Button>
      
      <div className="text-xs text-muted-foreground text-center w-full">
        {syncStatus?.status === 'running' && <span className="animate-pulse">Sync in progress, please wait...</span>}
      </div>
    </>
  );
};

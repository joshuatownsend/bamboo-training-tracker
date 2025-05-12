
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "./StatusBadge";
import { SyncStatus } from "../../../types/bamboo";

interface SyncStatusSummaryProps {
  syncStatus: SyncStatus | null;
  timeSinceRefresh: string;
  isSyncStatusLoading: boolean;
}

export const SyncStatusSummary: React.FC<SyncStatusSummaryProps> = ({ 
  syncStatus, 
  timeSinceRefresh, 
  isSyncStatusLoading 
}) => {
  if (isSyncStatusLoading) return null;
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Status:</span>
        {syncStatus ? <StatusBadge status={syncStatus.status} /> : <Badge variant="outline">Unknown</Badge>}
      </div>
      
      {syncStatus?.last_sync && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last sync:</span>
          <span>{formatDistanceToNow(new Date(syncStatus.last_sync), { addSuffix: true })}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Last refreshed:</span>
        <span>{timeSinceRefresh}</span>
      </div>
      
      {syncStatus?.error && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sync Error</AlertTitle>
          <AlertDescription className="mt-1 font-mono text-xs break-all">
            {syncStatus.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Add the missing Badge import
import { Badge } from "@/components/ui/badge";

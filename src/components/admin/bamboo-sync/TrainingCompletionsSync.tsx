
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Database, CheckCircle, AlertTriangle } from "lucide-react";
import { useSyncStatus } from "@/hooks/cache/useSyncStatus";
import { useQueryClient } from "@tanstack/react-query";

export const TrainingCompletionsSync: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStartTime, setSyncStartTime] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: syncStatus, isLoading, refetch } = useSyncStatus('training_completions');
  
  // Monitor the sync status to provide real-time updates
  useEffect(() => {
    if (isSyncing) {
      // Check sync status every 3 seconds while syncing
      const interval = setInterval(() => {
        refetch();
        
        // Check if sync is complete
        if (syncStatus?.status === 'success' || syncStatus?.status === 'error') {
          setIsSyncing(false);
          setSyncStartTime(null);
          clearInterval(interval);
          
          // Show appropriate notification
          if (syncStatus?.status === 'success') {
            toast({
              title: "Sync Completed",
              description: "Training completions data has been successfully synchronized.",
              variant: "default",
              className: "bg-green-50 border-green-200"
            });
            
            // Refresh related data
            queryClient.invalidateQueries({ queryKey: ['training_completions'] });
          } else if (syncStatus?.status === 'error') {
            toast({
              title: "Sync Failed",
              description: syncStatus.error || "An error occurred during synchronization.",
              variant: "destructive"
            });
          }
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isSyncing, syncStatus, refetch, toast, queryClient]);

  const triggerTrainingSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncStartTime(performance.now());
    
    try {
      toast({
        title: "Sync initiated",
        description: "Training completions sync process has been started.",
      });
      
      const { data, error } = await supabase.rpc('trigger_training_completions_sync');
      
      if (error) {
        console.error("Error triggering sync:", error);
        toast({
          title: "Sync error",
          description: `Failed to trigger the training completions sync: ${error.message}`,
          variant: "destructive",
        });
        setIsSyncing(false);
        setSyncStartTime(null);
      } else {
        // Success case - we'll let the useEffect monitor the status
        console.log("Sync requested successfully:", data);
        toast({
          title: "Sync requested",
          description: "Training completions sync has been requested successfully. This may take several minutes to complete.",
        });
        
        // Immediately refetch the status
        refetch();
      }
    } catch (e) {
      console.error("Exception during sync:", e);
      toast({
        title: "Sync exception",
        description: `An unexpected error occurred during the sync process: ${e instanceof Error ? e.message : String(e)}`,
        variant: "destructive",
      });
      setIsSyncing(false);
      setSyncStartTime(null);
    }
  };

  // Status indicator based on the current sync status
  const StatusIndicator = () => {
    if (!syncStatus) return null;
    
    if (syncStatus.status === 'success') {
      return (
        <div className="flex items-center text-green-600 text-sm mt-2">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>Last sync completed successfully {syncStatus.last_sync && new Date(syncStatus.last_sync).toLocaleString()}</span>
        </div>
      );
    } else if (syncStatus.status === 'error') {
      return (
        <div className="flex items-center text-red-600 text-sm mt-2">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Last sync failed: {syncStatus.error}</span>
        </div>
      );
    } else if (syncStatus.status === 'running') {
      return (
        <div className="flex items-center text-yellow-600 text-sm mt-2">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          <span>Sync in progress...</span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <div>
        <h3 className="text-lg font-medium text-yellow-800">Training Completions Sync</h3>
        <p className="text-sm mt-1 text-yellow-700">
          This will sync all training completion records from BambooHR into the local database for 
          improved performance and custom reporting.
        </p>
        <StatusIndicator />
      </div>
      
      <Alert className="bg-white border-yellow-200">
        <AlertTitle>About Training Completions Sync</AlertTitle>
        <AlertDescription className="text-sm">
          <p className="mb-2">
            Use this sync when you want to refresh the training completion data from BambooHR. 
            This is useful when:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>New training records have been added in BambooHR</li>
            <li>Existing training records have been modified in BambooHR</li>
            <li>You need to ensure training data is up-to-date for reports</li>
          </ul>
          <p className="mt-2 text-muted-foreground italic">
            Note: Training completion data is automatically synced daily at 4:00 AM.
          </p>
        </AlertDescription>
      </Alert>
      
      <Button
        onClick={triggerTrainingSync}
        disabled={isSyncing || isLoading}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
      >
        {isSyncing ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            {syncStartTime 
              ? `Syncing... (${((performance.now() - syncStartTime) / 1000).toFixed(1)}s)` 
              : "Syncing..."}
          </>
        ) : (
          <>
            <Database className="h-4 w-4 mr-2" />
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Training Completions Data
          </>
        )}
      </Button>
      
      {isSyncing && (
        <p className="text-xs text-center text-muted-foreground animate-pulse">
          This process may take several minutes depending on the amount of data.
        </p>
      )}
    </div>
  );
};

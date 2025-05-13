
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  RefreshCw, Database, CheckCircle, AlertTriangle, 
  AlertCircle, Clock, Info
} from "lucide-react";
import { useSyncStatus } from "@/hooks/cache/useSyncStatus";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

// Version of this component - helps track which version is deployed
const COMPONENT_VERSION = "1.1.0";

export const TrainingCompletionsSync: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStartTime, setSyncStartTime] = useState<number | null>(null);
  const [edgeFunctionVersion, setEdgeFunctionVersion] = useState<string | null>(null);
  const [versionCheckError, setVersionCheckError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: syncStatus, isLoading, refetch } = useSyncStatus('training_completions');
  
  // Check edge function version on component mount
  useEffect(() => {
    checkEdgeFunctionVersion();
  }, []);
  
  // Check which version of the edge function is deployed
  const checkEdgeFunctionVersion = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-training-completions/version');
      
      if (error) {
        console.error("Error checking edge function version:", error);
        setVersionCheckError(`Could not verify edge function version: ${error.message}`);
        return;
      }
      
      if (data && data.version) {
        console.log("Edge function version info:", data);
        setEdgeFunctionVersion(data.version);
        setVersionCheckError(null);
      } else {
        setVersionCheckError("Version endpoint returned invalid data");
      }
    } catch (e) {
      console.error("Exception checking edge function version:", e);
      setVersionCheckError(e instanceof Error ? e.message : String(e));
    }
  };
  
  // Monitor the sync status to provide real-time updates
  useEffect(() => {
    if (isSyncing) {
      // Check sync status every 3 seconds while syncing
      const interval = setInterval(() => {
        refetch();
        
        // Check if sync is complete
        if (syncStatus?.status === 'success' || 
            syncStatus?.status === 'partial_success' || 
            syncStatus?.status === 'error') {
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
          } else if (syncStatus?.status === 'partial_success') {
            toast({
              title: "Sync Completed with Warnings",
              description: "Some training completions were synced successfully, but there were some errors.",
              variant: "default",
              className: "bg-yellow-50 border-yellow-200"
            });
            
            // Still refresh the data we did get
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
      
      // Check edge function version first
      await checkEdgeFunctionVersion();
      
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

  // Enhanced status indicator with more detailed states and improved error reporting
  const StatusIndicator = () => {
    if (isLoading) {
      return (
        <div className="flex items-center text-blue-600 text-sm mt-2">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          <span>Loading sync status...</span>
        </div>
      );
    }
    
    if (!syncStatus) {
      return (
        <div className="flex items-center text-slate-600 text-sm mt-2">
          <Info className="h-4 w-4 mr-2" />
          <span>No sync status information available</span>
        </div>
      );
    }
    
    if (syncStatus.status === 'success') {
      return (
        <div className="flex items-center text-green-600 text-sm mt-2">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>Last sync completed successfully {syncStatus.last_sync && new Date(syncStatus.last_sync).toLocaleString()}</span>
        </div>
      );
    } else if (syncStatus.status === 'partial_success') {
      return (
        <div className="flex items-center text-yellow-600 text-sm mt-2">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>Last sync completed with warnings: {syncStatus.error || "Some records could not be processed"} {syncStatus.last_sync && new Date(syncStatus.last_sync).toLocaleString()}</span>
        </div>
      );
    } else if (syncStatus.status === 'error') {
      return (
        <div className="flex flex-col text-red-600 text-sm mt-2">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>Last sync failed</span>
          </div>
          {syncStatus.error && (
            <div className="mt-1 pl-6 text-xs">
              <span className="font-medium">Error:</span> {syncStatus.error}
            </div>
          )}
          {syncStatus.details && syncStatus.details.error_details && (
            <div className="mt-1 pl-6 text-xs max-w-full overflow-x-auto">
              <span className="font-medium">Details:</span> {syncStatus.details.error_details}
            </div>
          )}
        </div>
      );
    } else if (syncStatus.status === 'running') {
      return (
        <div className="flex items-center text-yellow-600 text-sm mt-2">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          <span>
            Sync in progress...
            {syncStatus.details && syncStatus.details.start_time && (
              <span className="ml-2 text-xs">
                (Started {new Date(syncStatus.details.start_time).toLocaleString()})
              </span>
            )}
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-slate-600 text-sm mt-2">
        <Clock className="h-4 w-4 mr-2" />
        <span>
          No sync has been run yet or status is unknown: {syncStatus.status}
        </span>
      </div>
    );
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
        
        {/* Version information */}
        <div className="mt-2 text-xs text-slate-500">
          {edgeFunctionVersion ? (
            <div className="flex items-center">
              <Info className="h-3 w-3 mr-1" />
              <span>Edge function version: {edgeFunctionVersion} | UI component version: {COMPONENT_VERSION}</span>
            </div>
          ) : versionCheckError ? (
            <div className="flex items-center text-amber-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              <span>Could not verify edge function version: {versionCheckError}</span>
            </div>
          ) : (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1 animate-pulse" />
              <span>Checking edge function version...</span>
            </div>
          )}
        </div>
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
      
      {syncStatus?.details && (syncStatus.status === 'error' || syncStatus.status === 'partial_success') && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4 pb-2">
            <h4 className="text-sm font-semibold text-red-700 mb-1">Error Details</h4>
            <div className="text-xs text-red-700 max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono">
                {JSON.stringify(syncStatus.details, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Button
        onClick={triggerTrainingSync}
        disabled={isSyncing || isLoading || syncStatus?.status === 'running'}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
      >
        {isSyncing || syncStatus?.status === 'running' ? (
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
      
      {(isSyncing || syncStatus?.status === 'running') && (
        <p className="text-xs text-center text-muted-foreground animate-pulse">
          This process may take several minutes depending on the amount of data.
        </p>
      )}
    </div>
  );
};

export default TrainingCompletionsSync;

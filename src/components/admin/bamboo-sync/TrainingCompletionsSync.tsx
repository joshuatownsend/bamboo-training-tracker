
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Database } from "lucide-react";

export const TrainingCompletionsSync: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStartTime, setSyncStartTime] = useState<number | null>(null);
  const { toast } = useToast();

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
          description: "Failed to trigger the training completions sync.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sync requested",
          description: "Training completions sync has been requested successfully. This may take several minutes to complete.",
        });
      }
    } catch (e) {
      console.error("Exception during sync:", e);
      toast({
        title: "Sync exception",
        description: "An unexpected error occurred during the sync process.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setSyncStartTime(null);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-100 rounded-md">
      <div>
        <h3 className="text-lg font-medium text-yellow-800">Training Completions Sync</h3>
        <p className="text-sm mt-1 text-yellow-700">
          This will sync all training completion records from BambooHR into the local database for 
          improved performance and custom reporting.
        </p>
      </div>
      
      <Alert variant="outline" className="bg-white border-yellow-200">
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
        disabled={isSyncing}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
      >
        <Database className="h-4 w-4 mr-2" />
        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing 
          ? syncStartTime 
            ? `Syncing... (${((performance.now() - syncStartTime) / 1000).toFixed(1)}s)` 
            : "Syncing..." 
          : "Sync Training Completions Data"}
      </Button>
      
      {isSyncing && (
        <p className="text-xs text-center text-muted-foreground animate-pulse">
          This process may take several minutes depending on the amount of data.
        </p>
      )}
    </div>
  );
};


import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from "@/contexts/user";
import { useBambooSync } from '@/hooks/cache/useBambooSync';

interface SyncActionsProps {
  onRefresh: () => void;
}

export const SyncActions = ({ onRefresh }: SyncActionsProps) => {
  const [syncingEmployees, setSyncingEmployees] = useState(false);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);
  const { toast } = useToast();
  const { refreshEmployeeId } = useUser();
  const { triggerSync } = useBambooSync();

  // Handle syncing employee data from BambooHR via edge function
  const handleSyncFromBambooHR = async () => {
    setSyncingEmployees(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-employee-mappings');
      
      if (error) {
        console.error("Error syncing employee mappings:", error);
        toast({
          title: "Sync Failed",
          description: error.message || "Failed to sync employee mappings from BambooHR",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Sync response:", data);
      
      if (data.success) {
        toast({
          title: "Sync Successful",
          description: `Synced ${data.count} employee mappings from BambooHR`,
        });
        
        // Reload the data to show updated mappings
        onRefresh();
        await refreshEmployeeId(); // Refresh the current user's employee ID if relevant
      } else {
        toast({
          title: "Sync Issue",
          description: data.message || "Unknown issue during sync",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Exception during sync:", error);
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setSyncingEmployees(false);
    }
  };

  // Handle manual execution of the cron job function
  const handleManualSync = async () => {
    setManualSyncLoading(true);
    
    try {
      // Get the result directly as a boolean value
      const result = await triggerSync();
      
      // Check if result is true (success)
      if (result) {
        toast({
          title: "Manual Sync Initiated",
          description: "The sync job has been manually triggered. Check status in the Sync Status panel.",
        });
        
        // Reload the data after a short delay to allow the sync to complete
        setTimeout(() => {
          onRefresh();
          refreshEmployeeId(); // Refresh the current user's employee ID if relevant
        }, 3000);
      }
    } catch (error) {
      console.error("Exception during manual sync:", error);
      toast({
        title: "Manual Sync Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setManualSyncLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Button
        variant="default"
        onClick={handleSyncFromBambooHR}
        disabled={syncingEmployees}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
      >
        {syncingEmployees ? "Syncing..." : "Sync from BambooHR"}
      </Button>
      
      <Button
        variant="outline"
        onClick={handleManualSync}
        disabled={manualSyncLoading}
        className="w-full"
      >
        {manualSyncLoading ? "Running..." : "Run Full Sync Job Now"}
      </Button>
    </div>
  );
};

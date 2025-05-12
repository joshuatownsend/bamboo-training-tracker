
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useUser } from "@/contexts/user";

/**
 * Hook for BambooHR sync operations
 */
export function useBambooSync() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { currentUser, isAdmin } = useUser();
  
  /**
   * Function to manually trigger a sync
   * @returns Promise<boolean> - Returns true if sync was successfully triggered, false otherwise
   */
  const triggerSync = async (): Promise<boolean> => {
    try {
      // Check if user is authenticated and has admin privileges
      if (!currentUser) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to trigger a sync.",
          variant: "destructive",
        });
        return false;
      }
      
      if (!isAdmin) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to trigger a sync.",
          variant: "destructive",
        });
        return false;
      }
      
      setIsSyncing(true);
      setSyncError(null);
      console.log("Triggering BambooHR sync...");
      
      // First update the sync status to indicate it's in progress
      try {
        const { error: updateError } = await supabase
          .from('sync_status')
          .update({ 
            status: 'running',
            error: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', 'bamboohr');
        
        if (updateError) {
          console.error("Error updating sync status:", updateError);
          throw new Error(`Failed to update sync status: ${updateError.message}`);
        }
      } catch (updateErr) {
        console.error("Exception updating sync status:", updateErr);
        // Continue even if status update fails
      }
      
      // Then call the database function that triggers the sync
      console.log("Calling trigger_bamboohr_sync RPC function...");
      const { data, error } = await supabase.rpc('trigger_bamboohr_sync');
      
      if (error) {
        console.error("Error triggering sync:", error);
        throw new Error(`Sync error: ${error.message}`);
      }
      
      console.log("Sync triggered successfully, response:", data);
      
      // Check if the response contains an error
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        console.error("Sync returned error in data:", data.error);
        throw new Error(`Sync returned error: ${data.error}`);
      }
      
      toast({
        title: "Sync Triggered",
        description: "BambooHR sync has been initiated successfully. Check status in a few moments.",
      });
      
      return true;
    } catch (error) {
      console.error("Error in triggerSync:", error);
      
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
        setSyncError(errorMessage);
      }
      
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Function to check sync status
   */
  const checkSyncStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'bamboohr')
        .single();
        
      if (error) {
        console.error("Error fetching sync status:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error checking sync status:", error);
      return null;
    }
  };
  
  return {
    triggerSync,
    checkSyncStatus,
    isSyncing,
    syncError
  };
}

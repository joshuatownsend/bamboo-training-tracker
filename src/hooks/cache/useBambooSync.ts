
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

/**
 * Hook for BambooHR sync operations
 */
export function useBambooSync() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  
  /**
   * Function to manually trigger a sync
   */
  const triggerSync = async () => {
    try {
      setIsSyncing(true);
      console.log("Triggering BambooHR sync...");
      
      // First update the sync status to indicate it's in progress
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
      
      // Then call the database function that triggers the sync
      const { data, error } = await supabase.rpc('trigger_bamboohr_sync');
      
      if (error) {
        console.error("Error triggering sync:", error);
        throw new Error(`Sync error: ${error.message}`);
      }
      
      console.log("Sync triggered successfully:", data);
      
      return true;
    } catch (error) {
      console.error("Error in triggerSync:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };
  
  return {
    triggerSync,
    isSyncing
  };
}

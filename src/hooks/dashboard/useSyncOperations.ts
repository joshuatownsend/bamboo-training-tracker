
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

/**
 * Hook for dashboard sync operations
 */
export function useSyncOperations(refetchDependencies: () => Promise<void>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get sync status for training completions
  const { data: trainingSyncStatus, isLoading: isTrainingSyncStatusLoading, refetch: refetchSyncStatus } = useQuery({
    queryKey: ['sync-status', 'training_completions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'training_completions')
        .single();
      
      if (error) {
        console.error("Error fetching training sync status:", error);
        return null;
      }
      
      return data;
    },
  });

  // Function to manually trigger a full data refresh
  const refreshDashboard = async () => {
    try {
      console.log("Manually refreshing dashboard data...");
      await refetchDependencies();
      await refetchSyncStatus();
      
      // Invalidate any prefetch query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'prefetch'] });
      queryClient.invalidateQueries({ queryKey: ['bamboo_training_types'] });
      
      toast({
        title: "Refresh initiated",
        description: "Dashboard data is being refreshed...",
      });
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh dashboard data",
        variant: "destructive"
      });
    }
  };

  // Function to trigger a full training completions sync
  const triggerTrainingSync = async () => {
    try {
      console.log("Triggering training completions sync...");
      
      const { data, error } = await supabase.rpc('trigger_training_completions_sync');
      
      if (error) {
        throw new Error(`Failed to trigger sync: ${error.message}`);
      }
      
      toast({
        title: "Sync started",
        description: "Training completions sync has been initiated. This may take several minutes.",
      });
      
      // Start polling for sync status
      const intervalId = setInterval(async () => {
        await refetchSyncStatus();
      }, 5000); // Check every 5 seconds
      
      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(intervalId);
        refreshDashboard(); // Final refresh after timeout
      }, 120000);
      
      return true;
    } catch (error) {
      console.error("Error triggering training sync:", error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to start training sync",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    syncStatus: trainingSyncStatus,
    isSyncStatusLoading: isTrainingSyncStatusLoading,
    refreshDashboard,
    triggerTrainingSync
  };
}

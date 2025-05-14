
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSyncStatus } from "@/hooks/cache/useSyncStatus";

/**
 * Hook to handle synchronization operations for dashboard data
 */
export function useSyncOperations(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  // Get the sync status from our cache hook
  const { 
    data: syncStatus, 
    triggerSync: triggerManualSync,
    isLoading: isSyncStatusLoading
  } = useSyncStatus();

  // Function to refresh dashboard data
  const refreshDashboard = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      console.log("Dashboard data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      toast({
        title: "Refresh failed",
        description: "Could not refresh dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to trigger training data sync
  const triggerTrainingSync = async () => {
    try {
      await triggerManualSync();
      toast({
        title: "Sync initiated",
        description: "Training data sync has started. This may take a few moments."
      });
    } catch (error) {
      console.error("Error triggering training sync:", error);
      toast({
        title: "Sync failed",
        description: "Could not initiate training data sync. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    syncStatus,
    isRefreshing,
    refreshDashboard,
    triggerTrainingSync
  };
}

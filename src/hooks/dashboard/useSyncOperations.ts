
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

/**
 * Hook for handling sync operations between BambooHR and the local database
 */
export function useSyncOperations(onDataRefresh: () => Promise<void>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current sync status
  const { data: syncStatus } = useQuery({
    queryKey: ['sync', 'status'],
    queryFn: async () => {
      console.log("Fetching sync status");
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'training_completions')
        .single();
        
      if (error) {
        console.warn("Error fetching sync status:", error);
        return null;
      }
      
      console.log("Current sync status:", data);
      return data;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  // Function to trigger a refresh of all dashboard data
  const refreshDashboard = useCallback(async () => {
    console.log("Refreshing dashboard data...");
    try {
      // Invalidate all relevant query caches
      await queryClient.invalidateQueries({queryKey: ['cached']});
      await queryClient.invalidateQueries({queryKey: ['training']});
      await queryClient.invalidateQueries({queryKey: ['employees']});
      await queryClient.invalidateQueries({queryKey: ['sync']});
      
      // Refresh the component data
      await onDataRefresh();
      
      console.log("Dashboard data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      toast({
        title: "Error refreshing data",
        description: "There was a problem refreshing the dashboard data.",
        variant: "destructive",
      });
    }
  }, [queryClient, onDataRefresh, toast]);

  // Function to trigger a sync of training data from BambooHR
  const triggerTrainingSync = useCallback(async () => {
    console.log("Triggering training sync...");
    try {
      // Call the Supabase function to sync training completions
      const { data, error } = await supabase
        .rpc('trigger_training_completions_sync');
        
      if (error) {
        throw new Error(`Error triggering sync: ${error.message}`);
      }
      
      console.log("Sync triggered successfully:", data);
      toast({
        title: "Training sync started",
        description: "The training data sync has been initiated. This may take a few minutes.",
      });
      
      // Refresh the sync status
      await queryClient.invalidateQueries({queryKey: ['sync']});
    } catch (error) {
      console.error("Error triggering training sync:", error);
      toast({
        title: "Error starting sync",
        description: error instanceof Error ? error.message : "There was a problem starting the training sync.",
        variant: "destructive",
      });
    }
  }, [queryClient, toast]);

  return {
    syncStatus,
    refreshDashboard,
    triggerTrainingSync
  };
}

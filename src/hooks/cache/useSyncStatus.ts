
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch the BambooHR sync status
 */
export function useSyncStatus() {
  return useQuery({
    queryKey: ['sync-status', 'bamboohr'],
    queryFn: async () => {
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
    },
    refetchInterval: 10000, // Refresh every 10 seconds when component is mounted
  });
}

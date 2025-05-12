
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to fetch the BambooHR sync status
 */
export function useSyncStatus() {
  const { currentUser } = useUser();
  
  return useQuery({
    queryKey: ['sync-status', 'bamboohr', currentUser?.id],
    queryFn: async () => {
      try {
        // Check if user is authenticated
        if (!currentUser) {
          console.warn("Attempting to fetch sync status without authentication");
          return null;
        }
        
        const { data, error } = await supabase
          .from('sync_status')
          .select('*')
          .eq('id', 'bamboohr')
          .single();
        
        if (error) {
          // If the error is related to permissions, we'll handle it silently
          // This prevents showing error toasts to regular users who don't have permissions
          if (error.code === 'PGRST116') {
            console.log("User doesn't have permission to access sync status - this is normal for non-admin users");
            return null;
          }
          
          console.error("Error fetching sync status:", error);
          return null;
        }
        
        return data;
      } catch (error) {
        console.error("Exception fetching sync status:", error);
        return null;
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds when component is mounted
    enabled: !!currentUser, // Only run the query if user is authenticated
  });
}

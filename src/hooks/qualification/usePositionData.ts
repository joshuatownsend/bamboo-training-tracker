
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to fetch position data for qualifications
 * @returns Position data query result
 */
export function usePositionData() {
  const { currentUser } = useUser();
  
  return useQuery({
    queryKey: ['position_data', currentUser?.id],
    queryFn: async () => {
      try {
        console.info("Fetching position data for qualifications...");
        
        const { data, error } = await supabase
          .from('positions')
          .select('*');
          
        if (error) {
          console.error("Error fetching position data:", error);
          throw error;
        }
        
        console.info(`Fetched position data: ${data.length} positions`);
        return data || [];
      } catch (error) {
        console.error("Exception in usePositionData:", error);
        toast({
          title: "Error loading position data",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!currentUser,
  });
}

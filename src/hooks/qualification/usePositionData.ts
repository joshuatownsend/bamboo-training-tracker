
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user";
import { toast } from "@/components/ui/use-toast";
import { Position } from "@/lib/types";

/**
 * Hook to fetch position data for qualifications
 * @returns Position data query result with additional properties
 */
export function usePositionData() {
  const { currentUser } = useUser();
  
  const query = useQuery({
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
        
        // Map the database columns to the Position interface
        const mappedPositions = data.map(position => ({
          id: position.id,
          title: position.title,
          description: position.description,
          department: position.department,
          countyRequirements: position.county_requirements,
          avfrdRequirements: position.avfrd_requirements,
          created_at: position.created_at,
          updated_at: position.updated_at,
        })) as Position[];
        
        return mappedPositions || [];
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

  // Return with the expected properties that components use
  return {
    positions: query.data as Position[],
    isLoadingPositions: query.isLoading,
    positionsError: query.error,
    ...query
  };
}

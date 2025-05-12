import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/user";
import { Position } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

export function usePositionData() {
  const { currentUser } = useUser();

  // Fetch positions from Supabase
  const {
    data: positions = [],
    isLoading: isLoadingPositions,
    error: positionsError
  } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('*');
      
      if (error) {
        console.error("Error fetching positions:", error);
        throw error;
      }
      
      return data.map(position => ({
        ...position,
        countyRequirements: position.county_requirements || [],
        avfrdRequirements: position.avfrd_requirements || []
      })) as Position[];
    },
    enabled: !!currentUser
  });

  return {
    positions,
    isLoadingPositions,
    positionsError
  };
}

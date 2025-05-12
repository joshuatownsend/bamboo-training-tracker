
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/user";
import { Position, RequirementGroup } from "@/lib/types";
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
      
      return data.map(position => {
        // Process county requirements data
        const countyReqs = position.county_requirements;
        let county_requirements;
        
        // Try to parse as JSON if it's not an array but might be a stringified object
        if (typeof countyReqs === 'string') {
          try {
            county_requirements = JSON.parse(countyReqs);
          } catch {
            county_requirements = [];
          }
        } else {
          county_requirements = countyReqs || [];
        }
        
        // Process AVFRD requirements data
        const avfrdReqs = position.avfrd_requirements;
        let avfrd_requirements;
        
        // Try to parse as JSON if it's not an array but might be a stringified object
        if (typeof avfrdReqs === 'string') {
          try {
            avfrd_requirements = JSON.parse(avfrdReqs);
          } catch {
            avfrd_requirements = [];
          }
        } else {
          avfrd_requirements = avfrdReqs || [];
        }
        
        return {
          ...position,
          county_requirements,
          avfrd_requirements
        };
      }) as Position[];
    },
    enabled: !!currentUser
  });

  return {
    positions,
    isLoadingPositions,
    positionsError
  };
}

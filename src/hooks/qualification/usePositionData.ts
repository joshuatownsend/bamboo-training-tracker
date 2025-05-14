
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Position } from "@/lib/types";
import { useEffect } from "react";

/**
 * Hook to fetch position data from Supabase
 */
export const usePositionData = () => {
  const { data: positions, isLoading, error, refetch } = useQuery({
    queryKey: ['positions'],
    queryFn: async (): Promise<Position[]> => {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('title');
      
      if (error) {
        console.error("Error fetching positions:", error);
        throw error;
      }
      
      if (!data) {
        return [];
      }
      
      console.log(`Fetched ${data.length} positions`);
      
      // Ensure requirements are properly formatted for use in our app
      return data.map(position => ({
        id: position.id,
        title: position.title,
        description: position.description || '',
        department: position.department || '',
        countyRequirements: position.county_requirements || [],
        avfrdRequirements: position.avfrd_requirements || [],
        created_at: position.created_at,
        updated_at: position.updated_at
      }));
    },
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
  
  // Log initial data for debugging
  useEffect(() => {
    if (positions) {
      console.log(`Loaded ${positions.length} positions`);
      if (positions.length > 0) {
        console.log("Sample position data:", positions[0]);
      }
    }
  }, [positions]);
  
  return { positions, isLoading, error, refetch };
};


import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Position } from "@/lib/types";

export function usePositionData() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchPositions = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) {
        throw new Error(`Error fetching positions: ${error.message}`);
      }
      
      // Map to Position type
      const mappedPositions: Position[] = data.map(pos => ({
        id: pos.id,
        title: pos.title,
        description: pos.description || "",
        department: pos.department || "Operations",
        countyRequirements: pos.county_requirements || [],
        avfrdRequirements: pos.avfrd_requirements || [],
        created_at: pos.created_at,
        updated_at: pos.updated_at
      }));
      
      setPositions(mappedPositions);
    } catch (err) {
      console.error("Error in fetchPositions:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const refetchPositions = async () => {
    await fetchPositions();
  };

  // For backward compatibility, alias isLoading as isLoadingPositions and error as positionsError
  return { 
    positions, 
    isLoading, 
    isLoadingPositions: isLoading,
    error, 
    positionsError: error,
    refetchPositions 
  };
}

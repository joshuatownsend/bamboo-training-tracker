
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Position } from "@/lib/types";

export function usePositionData() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to fetch positions from database
  const fetchPositions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('title');
        
      if (error) throw error;
      
      // Map the database records to Position type
      setPositions(data.map(position => ({
        id: position.id,
        title: position.title,
        description: position.description || '',
        department: position.department || '',
        countyRequirements: position.county_requirements || [],
        avfrdRequirements: position.avfrd_requirements || []
      })));
    } catch (err) {
      console.error('Error fetching positions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
      
      toast({
        title: "Error loading positions",
        description: "Could not load position data from the database",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch positions on component mount
  useEffect(() => {
    fetchPositions();
  }, []);
  
  return {
    positions,
    isLoading,
    error,
    refetchPositions: fetchPositions
  };
}

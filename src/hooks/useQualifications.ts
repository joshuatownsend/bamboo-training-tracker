
import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { QualificationStatus, Position, Training } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getAllPositionQualifications } from "@/lib/qualifications";
import { useToast } from "@/components/ui/use-toast";

export function useQualifications() {
  const { currentUser, isLoading: isUserLoading } = useUser();
  const [activeTab, setActiveTab] = useState("county");
  const { toast } = useToast();

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

  // Fetch user's trainings from BambooHR
  const {
    data: userTrainings = [],
    isLoading: isLoadingTrainings,
    error: trainingsError
  } = useQuery({
    queryKey: ['trainings', currentUser?.employeeId],
    queryFn: async () => {
      if (!currentUser?.employeeId) {
        throw new Error("No employee ID available");
      }

      const bamboo = new (await import('@/lib/bamboohr/api')).default({
        subdomain: 'avfrd',
        apiKey: '',
        useEdgeFunction: true,
        edgeFunctionUrl: import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
      });
      
      try {
        const result = await bamboo.fetchEmployeeTrainings(currentUser.employeeId);
        console.log("Fetched user trainings:", result);
        return result || [];
      } catch (err) {
        console.error("Error fetching training data:", err);
        throw err;
      }
    },
    enabled: !!currentUser?.employeeId
  });

  // Fetch all training types from Supabase
  const {
    data: trainingTypes = [],
    isLoading: isLoadingTrainingTypes
  } = useQuery({
    queryKey: ['training-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bamboo_training_types')
        .select('*');
      
      if (error) {
        console.error("Error fetching training types:", error);
        throw error;
      }
      
      return data as Training[];
    },
    enabled: !!currentUser
  });

  // Process training completions once we have the data
  const userCompletedTrainings = userTrainings.map(training => ({
    id: training.id,
    employeeId: currentUser?.employeeId || '',
    trainingId: training.trainingId || training.type?.toString() || '',
    completionDate: training.completionDate,
    status: 'completed' as const
  }));

  useEffect(() => {
    if (positionsError || trainingsError) {
      toast({
        title: "Error loading qualifications",
        description: "There was a problem loading your qualification data. Please try again later.",
        variant: "destructive"
      });
    }
  }, [positionsError, trainingsError, toast]);

  // Calculate qualifications once we have all required data
  const qualifications = currentUser && !isLoadingPositions && !isLoadingTrainings
    ? getAllPositionQualifications(
        currentUser.employeeId,
        positions,
        trainingTypes,
        userCompletedTrainings
      )
    : [];

  const isLoading = isUserLoading || isLoadingPositions || isLoadingTrainings || isLoadingTrainingTypes;
    
  return {
    qualifications,
    activeTab,
    setActiveTab,
    isLoading,
    error: positionsError || trainingsError
  };
}

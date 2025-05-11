
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DepartmentStats, TrainingStatistics } from "@/lib/types";
import { calculateTrainingStatistics } from "@/utils/calculateStatistics";

export function useComplianceData() {
  const { toast } = useToast();
  const [isRefetching, setIsRefetching] = useState(false);

  // Fetch employees data from BambooHR
  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    error: employeesError
  } = useQuery({
    queryKey: ['bamboohr', 'employees'],
    queryFn: async () => {
      console.log("Fetching employee data for Compliance Report...");
      const bamboo = new (await import('@/lib/bamboohr/api')).default({
        subdomain: 'avfrd',
        apiKey: '',
        useEdgeFunction: true,
        edgeFunctionUrl: import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
      });
      
      try {
        const result = await bamboo.getEmployees();
        console.log(`Fetched ${result.length} employees for Compliance Report`);
        return result || [];
      } catch (err) {
        console.error("Error fetching employees:", err);
        toast({
          title: "Error fetching employee data",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive"
        });
        throw err;
      }
    }
  });

  // Fetch trainings from BambooHR
  const {
    data: trainings = [],
    isLoading: isLoadingTrainings,
    error: trainingsError
  } = useQuery({
    queryKey: ['bamboohr', 'trainings'],
    queryFn: async () => {
      console.log("Fetching training data for Compliance Report...");
      const bamboo = new (await import('@/lib/bamboohr/api')).default({
        subdomain: 'avfrd',
        apiKey: '',
        useEdgeFunction: true,
        edgeFunctionUrl: import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
      });
      
      try {
        const result = await bamboo.getTrainings();
        console.log(`Fetched ${result.length} trainings for Compliance Report`);
        return result || [];
      } catch (err) {
        console.error("Error fetching trainings:", err);
        toast({
          title: "Error fetching training data",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive"
        });
        throw err;
      }
    }
  });

  // Fetch training completions from BambooHR
  const {
    data: completions = [],
    isLoading: isLoadingCompletions,
    error: completionsError
  } = useQuery({
    queryKey: ['bamboohr', 'completions'],
    queryFn: async () => {
      console.log("Fetching training completion data for Compliance Report...");
      const bamboo = new (await import('@/lib/bamboohr/api')).default({
        subdomain: 'avfrd',
        apiKey: '',
        useEdgeFunction: true,
        edgeFunctionUrl: import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
      });
      
      try {
        const data = await bamboo.fetchAllData();
        const result = data?.completions || [];
        console.log(`Fetched ${result.length} training completions for Compliance Report`);
        return result;
      } catch (err) {
        console.error("Error fetching training completions:", err);
        toast({
          title: "Error fetching training completions",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive"
        });
        throw err;
      }
    }
  });

  // Calculate statistics from the fetched data
  const statistics: TrainingStatistics = calculateTrainingStatistics(employees, trainings, completions);

  // Refetch data on demand
  const refetchAll = async () => {
    setIsRefetching(true);
    try {
      await Promise.all([
        // Intentionally not awaiting to allow parallel execution
      ]);
    } finally {
      setIsRefetching(false);
    }
  };

  return {
    employees,
    trainings,
    completions,
    statistics,
    isLoading: isLoadingEmployees || isLoadingTrainings || isLoadingCompletions || isRefetching,
    error: employeesError || trainingsError || completionsError,
    refetchAll
  };
}

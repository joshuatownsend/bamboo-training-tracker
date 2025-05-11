
import { useQuery } from "@tanstack/react-query";
import { Training } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import useBambooHR from "@/hooks/useBambooHR";

export function useTrainings() {
  const { isConfigured } = useBambooHR();
  const { toast } = useToast();

  const { data: trainings = [], isLoading: isLoadingTrainings, isError, error } = useQuery({
    queryKey: ['bamboohr', 'trainings'],
    queryFn: async () => {
      console.log("Fetching training data from BambooHR for Position Management...");
      const bamboo = new (await import('@/lib/bamboohr/api')).default({
        subdomain: 'avfrd',
        apiKey: '',
        useEdgeFunction: true,
        edgeFunctionUrl: import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
      });
      
      try {
        const result = await bamboo.fetchAllTrainings();
        console.log("Fetched training data for Position Management:", result ? `${result.length} items` : "No data");
        return result || [];
      } catch (err) {
        console.error("Error fetching training data:", err);
        toast({
          title: "Error fetching training data",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive"
        });
        throw err;
      }
    },
    enabled: isConfigured
  });

  return {
    trainings: trainings as Training[],
    isLoadingTrainings,
    isError,
    error
  };
}

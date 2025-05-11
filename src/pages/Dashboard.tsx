
import { useEffect, useState } from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import WelcomeMessages from "@/components/dashboard/WelcomeMessages";
import useBambooHR from "@/hooks/useBambooHR";
import { useToast } from "@/hooks/use-toast";
import { TrainingStatistics } from "@/lib/types";
import { calculateTrainingStatistics } from "@/utils/calculateStatistics";
import { prefetchBambooHRData } from "@/services/dataCacheService";

const Dashboard = () => {
  const { useAllData } = useBambooHR();
  const { data, isLoading, error, refetch } = useAllData();
  const { toast } = useToast();
  const [stats, setStats] = useState<TrainingStatistics | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Process BambooHR data to generate statistics
  useEffect(() => {
    if (data && data.employees) {
      setIsCalculating(true);
      
      console.log("Dashboard received data from BambooHR:", {
        employees: data.employees.length,
        trainings: data.trainings?.length || 0,
        completions: data.completions?.length || 0
      });
      
      // Use setTimeout to avoid blocking UI while calculating stats
      setTimeout(() => {
        try {
          const statistics = calculateTrainingStatistics(
            data.employees, 
            data.trainings || [], 
            data.completions || []
          );
          
          console.log("Calculated statistics:", statistics);
          setStats(statistics);
        } catch (err) {
          console.error("Error calculating statistics:", err);
          toast({
            title: "Error calculating statistics",
            description: "There was an error processing the training data",
            variant: "destructive"
          });
        } finally {
          setIsCalculating(false);
        }
      }, 10); // Small delay to let the UI render
    }
  }, [data, toast]);

  // Show error toast if BambooHR data fetch fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading dashboard data",
        description: error instanceof Error ? error.message : "Failed to load data from BambooHR",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Prefetch data when dashboard loads
  useEffect(() => {
    prefetchBambooHRData();
  }, []);

  // If loading or calculating, show skeleton UI
  if (isLoading || isCalculating) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Training Dashboard</h1>
        <button 
          onClick={() => refetch()} 
          className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Refresh Data
        </button>
      </div>
      
      {/* Welcome Messages - now using the context provider */}
      <WelcomeMessages />
      
      <DashboardStats 
        employeeCount={data?.employees?.length || 0}
        stats={stats}
      />
      
      <DashboardCharts 
        departmentStats={stats?.departmentStats}
        completions={data?.completions}
        employees={data?.employees}
        trainings={data?.trainings}
      />
    </div>
  );
};

export default Dashboard;

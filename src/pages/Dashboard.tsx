
import { useEffect, useState } from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import useBambooHR from "@/hooks/useBambooHR";
import { useToast } from "@/hooks/use-toast";
import { TrainingStatistics } from "@/lib/types";
import { calculateTrainingStatistics } from "@/utils/calculateStatistics";

const Dashboard = () => {
  const { useAllData } = useBambooHR();
  const { data, isLoading, error } = useAllData();
  const { toast } = useToast();
  const [stats, setStats] = useState<TrainingStatistics | null>(null);

  // Process BambooHR data to generate statistics
  useEffect(() => {
    if (data && data.employees && data.trainings) {
      console.log("Dashboard received data from BambooHR:", {
        employees: data.employees.length,
        trainings: data.trainings.length,
        completions: data.completions?.length || 0
      });
      
      // Log more details about completions to debug
      console.log("Completions data type:", typeof data.completions);
      console.log("Is completions an array?", Array.isArray(data.completions));
      
      if (Array.isArray(data.completions) && data.completions.length > 0) {
        console.log("Sample completion data:", data.completions[0]);
      } else {
        console.warn("No completions data received from BambooHR or data is not an array");
      }
      
      const statistics = calculateTrainingStatistics(
        data.employees, 
        data.trainings, 
        data.completions || []
      );
      
      console.log("Calculated statistics:", statistics);
      setStats(statistics);
    }
  }, [data]);

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

  // If loading, show skeleton UI
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Training Dashboard</h1>
      
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

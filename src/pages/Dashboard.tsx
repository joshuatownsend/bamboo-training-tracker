
import { useEffect } from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import WelcomeMessages from "@/components/dashboard/WelcomeMessages";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import useDashboardData from "@/hooks/useDashboardData";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { 
    employees, 
    trainings,
    completions,
    statistics, 
    isLoading, 
    refreshDashboard 
  } = useDashboardData();
  const { toast } = useToast();

  // Show performance warning one time if dashboard loads slowly
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      if (loadTime > 3000) {
        console.warn(`Dashboard took ${Math.round(loadTime)}ms to render completely`);
      }
    };
  }, []);

  // If loading, show skeleton UI
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Training Dashboard</h1>
        <Button 
          onClick={() => {
            refreshDashboard();
            toast({
              title: "Refreshing data",
              description: "Dashboard data is being updated..."
            });
          }} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Refresh Data
        </Button>
      </div>
      
      {/* Welcome Messages */}
      <WelcomeMessages />
      
      {/* Stats Cards */}
      <DashboardStats 
        employeeCount={employees?.length || 0}
        stats={statistics}
      />
      
      {/* Charts and Reports */}
      <DashboardCharts 
        departmentStats={statistics?.departmentStats}
        completions={completions}
        employees={employees}
        trainings={trainings}
      />
    </div>
  );
};

export default Dashboard;

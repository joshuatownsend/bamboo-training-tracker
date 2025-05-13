
import { useEffect } from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import WelcomeMessages from "@/components/dashboard/WelcomeMessages";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database } from "lucide-react";
import useDashboardData from "@/hooks/useDashboardData";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/user";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const { 
    employees, 
    trainings,
    completions,
    statistics, 
    isLoading, 
    refreshDashboard,
    triggerTrainingSync,
    syncStatus
  } = useDashboardData();
  const { toast } = useToast();
  const { isAdmin } = useUser();

  // Log data for debugging
  useEffect(() => {
    console.log("Dashboard data:", { 
      hasEmployees: Boolean(employees?.length), 
      employeesCount: employees?.length || 0,
      hasTrainings: Boolean(trainings?.length),
      trainingsCount: trainings?.length || 0,
      hasCompletions: Boolean(completions?.length),
      completionsCount: completions?.length || 0,
      hasStatistics: Boolean(statistics),
      statistics: statistics
    });
  }, [employees, trainings, completions, statistics]);

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

  // Format last sync time for display
  const getLastSyncInfo = () => {
    if (!syncStatus || !syncStatus.last_sync) return null;
    
    try {
      const lastSyncTime = new Date(syncStatus.last_sync);
      const timeAgo = formatDistanceToNow(lastSyncTime, { addSuffix: true });
      return `Last synced ${timeAgo}`;
    } catch (e) {
      console.error("Error formatting sync time:", e);
      return null;
    }
  };

  // If loading, show skeleton UI
  if (isLoading || !statistics) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Training Dashboard</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button 
              onClick={() => {
                triggerTrainingSync();
              }} 
              variant="outline" 
              size="sm"
              className="gap-2 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            >
              <Database className="h-4 w-4" /> Sync Training Data
            </Button>
          )}
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
      </div>
      
      {/* Sync Status for admins */}
      {isAdmin && syncStatus && (
        <div className="text-sm text-muted-foreground flex justify-end items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${
            syncStatus.status === 'running' ? 'bg-yellow-500 animate-pulse' : 
            syncStatus.status === 'success' ? 'bg-green-500' : 
            syncStatus.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
          }`}></span>
          <span>
            {syncStatus.status === 'running' ? 'Sync in progress...' : getLastSyncInfo()}
          </span>
        </div>
      )}
      
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

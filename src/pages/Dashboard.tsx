
import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Clock, AlertCircle, Users } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ComplianceChart from "@/components/dashboard/ComplianceChart";
import RecentCompletions from "@/components/dashboard/RecentCompletions";
import useBambooHR from "@/hooks/useBambooHR";
import { useToast } from "@/hooks/use-toast";
import { DepartmentStats, Employee, Training, TrainingCompletion, TrainingStatistics } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { useAllData } = useBambooHR();
  const { data, isLoading, error } = useAllData();
  const { toast } = useToast();
  const [stats, setStats] = useState<TrainingStatistics | null>(null);

  // Process BambooHR data to generate statistics
  useEffect(() => {
    if (data && data.employees && data.trainings) {
      const statistics = calculateTrainingStatistics(
        data.employees, 
        data.trainings, 
        data.completions || []
      );
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
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={data?.employees?.length || 0}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Completed Trainings"
          value={stats?.completedTrainings || 0}
          description={`${stats?.completionRate.toFixed(1) || 0}% completion rate`}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          title="Expired Trainings"
          value={stats?.expiredTrainings || 0}
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Total Courses"
          value={stats?.totalTrainings || 0}
          icon={<BookOpen className="h-5 w-5" />}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {stats && stats.departmentStats && (
          <ComplianceChart data={stats.departmentStats} />
        )}
        {data && (
          <RecentCompletions 
            completions={data.completions || []} 
            employees={data.employees || []} 
            trainings={data.trainings || []} 
          />
        )}
      </div>
    </div>
  );
};

// Skeleton UI for loading state
const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-56" />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    </div>
  );
};

// Function to calculate training statistics from real data
const calculateTrainingStatistics = (
  employees: Employee[], 
  trainings: Training[], 
  completions: TrainingCompletion[]
): TrainingStatistics => {
  // Calculate basic statistics
  const totalTrainings = trainings.length;
  const completedTrainings = completions.filter(c => c.status === "completed").length;
  const expiredTrainings = completions.filter(c => c.status === "expired").length;
  const upcomingTrainings = completions.filter(c => c.status === "due").length;
  
  // Calculate completion rate
  const completionRate = totalTrainings > 0 
    ? (completedTrainings / totalTrainings) * 100 
    : 0;
  
  // Calculate department statistics
  const departmentStats = calculateDepartmentStats(employees, trainings, completions);
  
  return {
    totalTrainings,
    completedTrainings,
    expiredTrainings,
    upcomingTrainings,
    completionRate,
    departmentStats
  };
};

// Helper function to calculate department statistics
const calculateDepartmentStats = (
  employees: Employee[], 
  trainings: Training[], 
  completions: TrainingCompletion[]
): DepartmentStats[] => {
  // Get unique departments
  const departments = [...new Set(employees.map(e => e.department))].filter(Boolean);
  
  return departments.map(department => {
    // Get employees in department
    const deptEmployees = employees.filter(e => e.department === department);
    
    // Get trainings that might be required for this department
    const requiredTrainings = trainings.filter(t => 
      t.requiredFor?.includes(department) || t.requiredFor?.includes('Required')
    );
    
    // Count total required trainings
    const totalRequired = deptEmployees.length * requiredTrainings.length;
    
    // Count completed trainings
    const completedCount = completions.filter(c => 
      c.status === "completed" && 
      deptEmployees.some(e => e.id === c.employeeId) &&
      requiredTrainings.some(t => t.id === c.trainingId)
    ).length;
    
    // Calculate compliance rate
    const complianceRate = totalRequired > 0 
      ? Math.round((completedCount / totalRequired) * 100) 
      : 100;
    
    return {
      department,
      completedCount,
      totalRequired,
      complianceRate
    };
  });
};

export default Dashboard;

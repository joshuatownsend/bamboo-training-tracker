
import { BookOpen, CheckCircle2, Clock, AlertCircle, Users } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { TrainingStatistics } from "@/lib/types";

interface DashboardStatsProps {
  employeeCount: number;
  stats: TrainingStatistics | null;
}

export function DashboardStats({ employeeCount, stats }: DashboardStatsProps) {
  // Make sure we always have valid numbers to display
  const totalTrainings = stats?.totalTrainings ?? 0;
  const completedTrainings = stats?.completedTrainings ?? 0;
  const expiredTrainings = stats?.expiredTrainings ?? 0;
  const completionRate = stats?.completionRate ?? 0;
  
  // Add console log for debugging
  console.log("Dashboard Stats rendering with:", {
    employeeCount,
    totalTrainings,
    completedTrainings,
    expiredTrainings,
    completionRate,
    rawStats: stats
  });
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Employees"
        value={employeeCount || 0}
        icon={<Users className="h-5 w-5" />}
      />
      <StatCard
        title="Completed Trainings"
        value={completedTrainings}
        description={`${completionRate.toFixed(1)}% completion rate`}
        icon={<CheckCircle2 className="h-5 w-5" />}
      />
      <StatCard
        title="Expired Trainings"
        value={expiredTrainings}
        icon={<AlertCircle className="h-5 w-5" />}
      />
      <StatCard
        title="Total Courses"
        value={totalTrainings}
        icon={<BookOpen className="h-5 w-5" />}
      />
    </div>
  );
}

export default DashboardStats;

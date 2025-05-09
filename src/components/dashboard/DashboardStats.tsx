
import { BookOpen, CheckCircle2, Clock, AlertCircle, Users } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { TrainingStatistics } from "@/lib/types";

interface DashboardStatsProps {
  employeeCount: number;
  stats: TrainingStatistics | null;
}

export function DashboardStats({ employeeCount, stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Employees"
        value={employeeCount}
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
  );
}

export default DashboardStats;

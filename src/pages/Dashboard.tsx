
import { BookOpen, CheckCircle2, Clock, AlertCircle, Users } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ComplianceChart from "@/components/dashboard/ComplianceChart";
import RecentCompletions from "@/components/dashboard/RecentCompletions";
import { 
  employees, 
  trainings, 
  trainingCompletions,
  getTrainingStatistics
} from "@/lib/data";

const Dashboard = () => {
  const stats = getTrainingStatistics();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Training Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={employees.length}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Completed Trainings"
          value={stats.completedTrainings}
          description={`${stats.completionRate.toFixed(1)}% completion rate`}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          title="Expired Trainings"
          value={stats.expiredTrainings}
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Total Courses"
          value={stats.totalTrainings}
          icon={<BookOpen className="h-5 w-5" />}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <ComplianceChart data={stats.departmentStats} />
        <RecentCompletions 
          completions={trainingCompletions} 
          employees={employees} 
          trainings={trainings} 
        />
      </div>
    </div>
  );
};

export default Dashboard;

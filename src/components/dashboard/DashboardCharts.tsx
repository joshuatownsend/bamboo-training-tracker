
import ComplianceChart from "@/components/dashboard/ComplianceChart";
import RecentCompletions from "@/components/dashboard/RecentCompletions";
import { DepartmentStats, Employee, Training, TrainingCompletion } from "@/lib/types";

interface DashboardChartsProps {
  departmentStats: DepartmentStats[] | undefined;
  completions: TrainingCompletion[] | undefined;
  employees: Employee[] | undefined;
  trainings: Training[] | undefined;
}

export function DashboardCharts({ 
  departmentStats, 
  completions, 
  employees, 
  trainings 
}: DashboardChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {departmentStats && (
        <ComplianceChart data={departmentStats} />
      )}
      {completions && employees && trainings && (
        <RecentCompletions 
          completions={completions} 
          employees={employees} 
          trainings={trainings} 
        />
      )}
    </div>
  );
}

export default DashboardCharts;


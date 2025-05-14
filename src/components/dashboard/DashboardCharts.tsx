
import { Card } from "@/components/ui/card";
import ComplianceChart from "./ComplianceChart";
import RecentCompletions from "./RecentCompletions";
import { DepartmentStats, Employee, Training, TrainingCompletion } from "@/lib/types";

interface DashboardChartsProps {
  departmentStats?: DepartmentStats[];
  completions?: TrainingCompletion[];
  employees?: Employee[];
  trainings?: Training[];
}

export function DashboardCharts({
  departmentStats = [],
  completions = [],
  employees = [],
  trainings = []
}: DashboardChartsProps) {
  // Log data for debugging
  console.log("DashboardCharts received:", {
    departmentStatsCount: departmentStats?.length || 0,
    completionsCount: completions?.length || 0,
    employeesCount: employees?.length || 0,
    trainingsCount: trainings?.length || 0
  });

  // Log sample data for better debugging
  if (completions.length > 0) {
    console.log("Sample completion:", completions[0]);
  }
  
  if (employees.length > 0) {
    console.log("Sample employee:", employees[0]);
  }
  
  if (trainings.length > 0) {
    console.log("Sample training:", trainings[0]);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Department Compliance Chart */}
      <Card className="col-span-2">
        <ComplianceChart departmentStats={departmentStats} />
      </Card>
      
      {/* Recent Completions */}
      <div className="lg:col-span-1">
        <RecentCompletions 
          completions={completions} 
          employees={employees} 
          trainings={trainings} 
        />
      </div>
    </div>
  );
}

export default DashboardCharts;

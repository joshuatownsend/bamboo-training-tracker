
export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  avatar?: string;
  hireDate: string;
}

export interface Training {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  durationHours: number;
  requiredFor: string[];
}

export interface TrainingCompletion {
  id: string;
  employeeId: string;
  trainingId: string;
  completionDate: string;
  expirationDate?: string;
  status: 'completed' | 'expired' | 'due';
  score?: number;
  certificateUrl?: string;
}

export interface DepartmentStats {
  department: string;
  completedCount: number;
  totalRequired: number;
  complianceRate: number;
}

export interface TrainingStatistics {
  totalTrainings: number;
  completedTrainings: number;
  expiredTrainings: number;
  upcomingTrainings: number;
  completionRate: number;
  departmentStats: DepartmentStats[];
}

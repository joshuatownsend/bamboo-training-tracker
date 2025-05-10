
export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  division: string;
  email: string;
  avatar?: string;
  hireDate: string;
  
  // Add these missing properties that are used in the components
  displayName?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  workEmail?: string;
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

// New interfaces for AVFRD specific requirements
export interface Position {
  id: string;
  title: string;
  description: string;
  department: string;
  countyRequirements: string[]; // Training IDs required by Loudoun County
  avfrdRequirements: string[]; // Training IDs required by AVFRD
}

export interface QualificationStatus {
  positionId: string;
  positionTitle: string;
  isQualifiedCounty: boolean;
  isQualifiedAVFRD: boolean;
  missingCountyTrainings: Training[];
  missingAVFRDTrainings: Training[];
  completedTrainings: Training[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  employeeId: string;
}

export interface UserTraining {
  id: string;
  employeeId: string;
  trainingId: string;
  completionDate: string;
  instructor?: string;
  notes?: string;
  trainingDetails: Training | null;
  // Add type or any other fields that might be present in the BambooHR response
  type?: string;  
  completed?: string;
}

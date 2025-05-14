
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
  
  // Add the lastSync property to fix the TypeScript error
  lastSync?: string | null;
  
  // Add bambooEmployeeId property for proper ID matching - keep as string
  bambooEmployeeId?: string;
  // For backward compatibility with existing code
  bamboo_employee_id?: string;
}

export interface Training {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  durationHours: number;
  requiredFor: string[];
  // Add expirationDate to fix the type error
  expirationDate?: string;
  // Add expiryYears property
  expiryYears?: number;
  // Add external URL property
  externalUrl?: string;
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
  notes?: string;
  instructor?: string;
  // Add these properties to store joined data
  employeeData?: {
    id: string;
    name: string;
    bamboo_employee_id: string;
    email?: string;
    [key: string]: any;
  };
  trainingData?: {
    id: string;
    name: string;
    category?: string;
    [key: string]: any;
  };
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

// Updated Position interface to include complex requirement structures
export interface Position {
  id: string;
  title: string;
  description: string;
  department: string;
  countyRequirements: string[] | RequirementGroup; // Support both legacy array and new structure
  avfrdRequirements: string[] | RequirementGroup; // Support both legacy array and new structure
  created_at?: string;
  updated_at?: string;
}

// New types for complex requirement logic
export type RequirementLogic = 'AND' | 'OR' | 'X_OF_Y';

export interface RequirementGroup {
  logic: RequirementLogic;
  requirements: (string | RequirementGroup)[]; // Can be training IDs or nested groups
  count?: number; // Used for X_OF_Y logic to specify X
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
  // Add the bambooEmployeeId property - keep as string
  bambooEmployeeId?: string;
}

export interface UserTraining {
  id?: string;  // Make id optional since it might not always be available
  employeeId: string;
  trainingId?: string;
  completionDate: string;
  instructor?: string;
  notes?: string;
  trainingDetails: Training | null;
  // Add type or any other fields that might be present in the BambooHR response
  type?: string;  
  completed?: string;
  // Add displayName property which is used in the mapToUserTraining function
  displayName?: string;
}

export interface TrainingType {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

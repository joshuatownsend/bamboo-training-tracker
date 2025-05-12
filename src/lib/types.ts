export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  division: string;
  email: string;
  avatar?: string;
  hire_date: string;
  
  // Add these as snake_case to match database schema
  display_name?: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  work_email?: string;
}

export interface Training {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  duration_hours: number;
  required_for: string[];
  expiration_date?: string;
  expiry_years?: number;
  external_url?: string;
}

export interface TrainingCompletion {
  id: string;
  employee_id: string;
  training_id: string;
  completion_date: string;
  expiration_date?: string;
  status: 'completed' | 'expired' | 'due';
  score?: number;
  certificate_url?: string;
}

export interface DepartmentStats {
  department: string;
  completed_count: number;
  total_required: number;
  compliance_rate: number;
}

export interface TrainingStatistics {
  total_trainings: number;
  completed_trainings: number;
  expired_trainings: number;
  upcoming_trainings: number;
  completion_rate: number;
  department_stats: DepartmentStats[];
}

// Updated Position interface to include complex requirement structures
export interface Position {
  id: string;
  title: string;
  description: string;
  department: string;
  county_requirements: string[] | RequirementGroup; // Support both legacy array and new structure
  avfrd_requirements: string[] | RequirementGroup; // Support both legacy array and new structure
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
  position_id: string;
  position_title: string;
  is_qualified_county: boolean;
  is_qualified_avfrd: boolean;
  missing_county_trainings: Training[];
  missing_avfrd_trainings: Training[];
  completed_trainings: Training[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  employee_id: string;
}

export interface UserTraining {
  id: string;
  employee_id: string;
  training_id?: string;
  completion_date: string;
  instructor?: string;
  notes?: string;
  training_details: Training | null;
  type?: string;
  completed?: string;
}

export interface TrainingType {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

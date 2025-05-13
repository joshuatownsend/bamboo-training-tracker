
export interface SyncStatus {
  id: string;
  status: 'success' | 'running' | 'error' | 'never_run' | 'partial_success' | string;
  updated_at: string;
  last_sync?: string;
  error?: string | null;
  details?: SyncStatusDetails; // Now we're using a specific type for details
}

// Add a proper type for the details property
export interface SyncStatusDetails {
  version?: string;
  deploymentId?: string;
  error_details?: string;
  start_time?: string;
  errors?: string[];
  failedEmployees?: Array<{ id: string; error: string }>;
  employeeResults?: Record<string, { success: boolean; count?: number; error?: string }>;
  [key: string]: any; // For any other properties that might be present
}

export interface CachedEmployee {
  id: string;
  employee_id?: string; // Made optional since it's not present in Employee type
  firstName?: string;
  lastName?: string;
  department?: string;
  email?: string;
  name?: string; // Added to match Employee type
  position?: string; // Added to match Employee type
  jobTitle?: string; // Added to match Employee type
  division?: string; // Added to match Employee type
  workEmail?: string; // Added to match Employee type
  displayName?: string; // Added to match Employee type
  avatar?: string; // Added to match Employee type
  hireDate?: string; // Added to match Employee type
  created_at?: string;
  updated_at?: string;
  raw_data?: any;
}

export interface CachedTraining {
  id: string;
  training_id?: string; // Made optional since it's not present in Training type
  name?: string;
  title?: string; // Added to match Training type
  type?: string; // Added to match Training type
  category?: string;
  description?: string;
  duration_hours?: number; // Added to match Training's durationHours
  required_for?: string[]; // Added to match Training's requiredFor
  created_at?: string;
  updated_at?: string;
  raw_data?: any;
}

export interface CachedCompletion {
  id: string;
  employee_id: string;
  training_id: string;
  completionDate?: string;
  expirationDate?: string;
  status?: string; // Added to match TrainingCompletion status
  score?: number; // Added to match TrainingCompletion score
  certificateUrl?: string; // Added to match TrainingCompletion certificateUrl
  created_at?: string;
  updated_at?: string;
  raw_data?: any;
}

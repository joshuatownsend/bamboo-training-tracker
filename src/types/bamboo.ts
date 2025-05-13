
export interface SyncStatus {
  id: string;
  status: string;
  last_sync: string | null;
  updated_at: string;
  error: string | null;
  details?: SyncStatusDetails;
}

export interface SyncStatusDetails {
  version?: string;
  deploymentId?: string;
  start_time?: string;
  error_time?: string;
  triggered_by?: string;
  auth_method?: string;
  error_details?: string;
  errors?: string[];
  failedEmployees?: { id: string; error: string }[];
  employeeResults?: Record<string, { success: boolean; count?: number; error?: string }>;
}

export interface CachedEmployee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  email?: string;
  position?: string;
  jobTitle?: string;
  division?: string;
  workEmail?: string;
  displayName?: string;
  avatar?: string;
  hireDate?: string;
}

export interface CachedTraining {
  id: string;
  title: string;
  name: string;
  type?: string;
  category?: string;
  description?: string;
  duration_hours?: number;
  required_for?: string[];
}

export interface CachedCompletion {
  id?: string;
  employee_id: string;
  training_id: string;
  completionDate?: string;
  expirationDate?: string; 
  status?: string;
  score?: number;
  certificateUrl?: string;
}

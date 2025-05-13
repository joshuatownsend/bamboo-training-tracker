
/**
 * Types for BambooHR data structures
 */

// Type for cached employee data
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

// Type for cached training data
export interface CachedTraining {
  id: string;
  title: string;
  name: string; // Alias for title to maintain compatibility
  type?: string;
  category?: string;
  description?: string;
  duration_hours?: number;
  required_for?: string[];
}

// Type for cached completion data
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

// Type for sync status from database
export interface SyncStatus {
  id: string;
  status?: string;
  last_sync?: string;
  updated_at?: string;
  error?: string;
  details?: SyncStatusDetails;
}

// Type for the details field in sync_status
export interface SyncStatusDetails {
  start_time?: string;
  end_time?: string;
  duration_seconds?: number;
  triggered_by?: string;
  auth_method?: string;
  error_details?: string;
  version?: string;
  [key: string]: any; // For other potential fields
}

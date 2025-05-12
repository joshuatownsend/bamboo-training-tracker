
export interface SyncStatus {
  id: string;
  status: 'success' | 'running' | 'error' | 'never_run' | string;
  updated_at: string;
  last_sync?: string;
  error?: string | null;
}

export interface CachedEmployee {
  id: string;
  employee_id: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  raw_data?: any;
}

export interface CachedTraining {
  id: string;
  training_id: string;
  name?: string;
  category?: string;
  description?: string;
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
  created_at?: string;
  updated_at?: string;
  raw_data?: any;
}

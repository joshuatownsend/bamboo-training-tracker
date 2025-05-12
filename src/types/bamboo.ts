
export interface SyncStatus {
  id: string;
  status: 'success' | 'running' | 'error' | 'never_run' | string;
  updated_at: string;
  last_sync?: string;
  error?: string | null;
}

export interface CachedEmployee {
  id: string;
  employee_id?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  email?: string;
  name?: string;
  position?: string;
  job_title?: string;
  division?: string;
  work_email?: string;
  display_name?: string;
  avatar?: string;
  hire_date?: string;
  created_at?: string;
  updated_at?: string;
  raw_data?: any;
}

export interface CachedTraining {
  id: string;
  training_id?: string;
  name?: string;
  title?: string;
  type?: string;
  category?: string;
  description?: string;
  duration_hours?: number;
  required_for?: string[];
  created_at?: string;
  updated_at?: string;
  raw_data?: any;
}

export interface CachedCompletion {
  id: string;
  employee_id: string;
  training_id: string;
  completion_date?: string;
  expiration_date?: string;
  status?: string;
  score?: number;
  certificate_url?: string;
  created_at?: string;
  updated_at?: string;
  raw_data?: any;
}


/**
 * Type definitions for Supabase database rows
 * These match the structure of data returned from Supabase queries
 */

export interface EmployeeRow {
  id: string;
  name: string | null;
  bamboo_employee_id: number;
  email: string | null;
  display_name?: string | null;
}

export interface TrainingRow {
  id: number;
  name: string;
  category: string | null;
  description?: string | null;
}

export interface CompletionJoinedRow {
  employee_id: number;
  training_id: number; 
  completed: string;
  display_name: string;
  instructor?: string | null;
  notes?: string | null;
  employee: EmployeeRow | null;
  training: TrainingRow | null;
}


export interface BambooApiOptions {
  subdomain: string;
  api_key: string;
  use_proxy?: boolean;
  use_edge_function?: boolean;
  edge_function_url?: string;
  client?: any;
}

export interface BambooEmployee {
  id: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  job_title?: {
    name: string;
  } | string;
  department?: {
    name: string;
  } | string;
  division?: string;
  work_email?: string;
  email?: string;
  photo_url?: string;
  hire_date?: string;
}

export interface BambooTraining {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string;
  duration: number;
  required_for?: string[];
}

export interface BambooTrainingCompletion {
  id: string;
  employee_id: string;
  training_id: string;
  completed_date: string;
  expiration_date?: string;
  status: string;
  score?: number;
  certificate_url?: string;
}

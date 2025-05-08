
// BambooHR API response types
export interface BambooEmployee {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  jobTitle: {
    name: string;
  };
  department: {
    name: string;
  };
  workEmail: string;
  hireDate: string;
  photoUrl?: string;
  customFields?: Record<string, any>;
}

export interface BambooTraining {
  id: string;
  name: string;
  type: string;
  description: string;
  category: string;
  duration: number;
  isRequired: boolean;
  requiredFor: string[];
}

export interface BambooTrainingCompletion {
  id: string;
  employeeId: string;
  trainingId: string;
  completedDate: string;
  expirationDate?: string;
  status: string;
  score?: number;
  certificateUrl?: string;
}

export interface BambooApiOptions {
  apiKey: string;
  subdomain: string;
}

export interface BambooApiOptions {
  subdomain: string;
  apiKey: string;
  useProxy?: boolean;
  useEdgeFunction?: boolean;
  edgeFunctionUrl?: string;
}

export interface BambooEmployee {
  id: string;
  displayName?: string;
  firstName: string;
  lastName: string;
  jobTitle?: {
    name: string;
  };
  department?: {
    name: string;
  };
  workEmail?: string;
  photoUrl?: string;
  hireDate?: string;
}

export interface BambooTraining {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string;
  duration: number;
  requiredFor?: string[];
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

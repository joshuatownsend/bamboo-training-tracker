
export interface BambooApiOptions {
  subdomain: string;
  apiKey: string;
  useEdgeFunction?: boolean;
  edgeFunctionUrl?: string;
  client?: any;
  timeout?: number; // Added timeout option
}

export interface EdgeFunctionSecretsResult {
  success: boolean;
  message?: string;
  secretsConfigured?: boolean;
  secrets: {
    BAMBOOHR_SUBDOMAIN: boolean;
    BAMBOOHR_API_KEY: boolean;
  };
  environmentKeys?: string[];
  timestamp?: string;
  deploymentVerification?: string;
}

export interface BambooHRClientInterface {
  testEndpointExists(path: string): Promise<boolean>;
  testConnection(): Promise<boolean>;
  fetchRawResponse(path: string, options?: RequestInit): Promise<Response>;
  fetchFromBamboo(path: string, options?: RequestInit): Promise<any>;
  getEmployees(): Promise<any[]>;
  getTrainings(): Promise<any[]>;
  getUserTrainings(employeeId: string, timeoutMs?: number): Promise<any[]>;
  checkEdgeFunctionSecrets(): Promise<EdgeFunctionSecretsResult>;
}

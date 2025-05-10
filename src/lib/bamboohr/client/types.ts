
export interface BambooApiOptions {
  subdomain: string;
  apiKey: string;
  useEdgeFunction?: boolean;
  edgeFunctionUrl?: string;
}

export interface EdgeFunctionSecretsResult {
  secretsConfigured: boolean;
  error?: string;
  secrets?: Record<string, boolean>;
  environmentKeys?: string[];
}

export interface BambooHRClientInterface {
  fetchRawResponse(endpoint: string, method?: string, body?: any, timeoutMs?: number): Promise<Response>;
  checkEdgeFunctionSecrets(): Promise<EdgeFunctionSecretsResult>;
  testEndpointExists(endpoint: string): Promise<boolean>;
  fetchAllData(isConnectionTest?: boolean): Promise<any>;
  testConnection(): Promise<boolean>;
  getEmployees(): Promise<any[]>;
  getTrainings(): Promise<any[]>;
  getUserTrainings(employeeId: string, timeoutMs?: number): Promise<any[]>;
  getClient(): any;
  fetchFromBamboo(endpoint: string, method?: string, body?: any): Promise<any>;
}

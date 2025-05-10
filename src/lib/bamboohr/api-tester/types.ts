
/**
 * Types for the BambooHR API tester
 */

export interface EndpointTestResult {
  endpoint: string;
  exists: boolean;
  error?: string;
  data?: any;
  responseType?: string;
  status?: number;
}

export interface ApiTestResults {
  results: EndpointTestResult[];
  accessibleEndpoints: string[];
  recommendations: string[];
}

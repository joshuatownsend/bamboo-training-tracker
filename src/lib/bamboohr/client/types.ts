
/**
 * Types for BambooHR client
 */

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

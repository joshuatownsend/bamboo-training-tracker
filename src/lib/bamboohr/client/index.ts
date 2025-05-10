
/**
 * Re-export all the client components
 */
export { BambooHRClient } from './base';
export type { BambooApiOptions, BambooHRClientInterface, EdgeFunctionSecretsResult } from './types';

// Re-export the core classes if they need to be used directly
export { BaseBambooClient } from './core/base-client';
export { ApiFetcher } from './core/api-fetcher';
export { ConnectionTester } from './core/connection-tester';
export { DataFetcher } from './core/data-fetcher';

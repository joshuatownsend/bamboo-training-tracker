import { BambooApiOptions, BambooHRClientInterface, EdgeFunctionSecretsResult } from './types';
import { DataFetcher } from './core/data-fetcher';

/**
 * BambooHR API client class
 * Implements BambooHRClientInterface
 * This is now a thin wrapper around the modularized functionality
 */
export class BambooHRClient extends DataFetcher implements BambooHRClientInterface {
  /**
   * Constructor simply passes options to the parent classes
   */
  constructor(options: BambooApiOptions) {
    super(options);
  }
  
  // All required interface methods are now implemented via inheritance
  // from the specialized classes:
  // - BaseBambooClient: Basic configuration and core methods
  // - ApiFetcher: API request handling with retries
  // - ConnectionTester: Connection testing functionality
  // - DataFetcher: Employee and training data retrieval
}

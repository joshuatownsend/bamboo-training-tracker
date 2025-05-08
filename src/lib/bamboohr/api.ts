
// This file now serves as a barrel export for the BambooHR module
import BambooHRService from './service';

// Re-export the main service class as the default export
export default BambooHRService;

// Export any other items that external modules might need
export * from './client';

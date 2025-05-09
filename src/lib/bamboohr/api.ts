
import { BambooHRClient } from './client';
import { Employee, Training, TrainingCompletion } from '@/lib/types';
import BambooHRService from './service';

interface BambooHRServiceOptions {
  subdomain: string;
  apiKey: string;
  useEdgeFunction?: boolean;
  edgeFunctionUrl?: string;
}

class BambooHRApiClient {
  private client: BambooHRClient;
  private service: BambooHRService;

  constructor(options: BambooHRServiceOptions) {
    this.client = new BambooHRClient({
      subdomain: options.subdomain,
      apiKey: options.apiKey,
      useEdgeFunction: options.useEdgeFunction || false,
      edgeFunctionUrl: options.edgeFunctionUrl
    });
    
    this.service = new BambooHRService({
      subdomain: options.subdomain,
      apiKey: options.apiKey,
      useEdgeFunction: options.useEdgeFunction || false,
      edgeFunctionUrl: options.edgeFunctionUrl
    });
  }
  
  // Test connection to BambooHR API
  async testConnection(): Promise<boolean> {
    return this.service.testConnection();
  }
  
  // Get all employees
  async getEmployees(): Promise<Employee[]> {
    return this.service.getEmployees();
  }
  
  // Get all trainings
  async getTrainings(): Promise<Training[]> {
    return this.service.getTrainings();
  }

  async fetchAllEmployees(): Promise<Employee[]> {
    return this.client.fetchFromBamboo('/employees/directory');
  }

  async fetchAllTrainings(): Promise<Training[]> {
    return this.client.fetchFromBamboo('/custom_reports/report?id=40');
  }

  async fetchAllCompletions(): Promise<TrainingCompletion[]> {
    return this.client.fetchFromBamboo('/custom_reports/report?id=41');
  }

  async fetchAllData(): Promise<{ employees: Employee[], trainings: Training[], completions: TrainingCompletion[] } | null> {
    try {
      return this.service.fetchAllData();
    } catch (error) {
      console.error("Error fetching all data from BambooHR:", error);
      throw error;
    }
  }
}

export default BambooHRApiClient;

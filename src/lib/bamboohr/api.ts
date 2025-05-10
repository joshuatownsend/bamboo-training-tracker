
import { BambooHRClient } from './client/base';
import { BambooHRApiClient } from './client/api-client';
import { Employee, Training, TrainingCompletion, UserTraining } from '@/lib/types';
import BambooHRService from './service';
import { BambooHRClientInterface } from './client/types';

interface BambooHRServiceOptions {
  subdomain: string;
  apiKey: string;
  useEdgeFunction?: boolean;
  edgeFunctionUrl?: string;
}

class BambooHRApi {
  private client: BambooHRClientInterface;
  private service: BambooHRService;

  constructor(options: BambooHRServiceOptions) {
    this.client = new BambooHRApiClient({
      subdomain: options.subdomain,
      apiKey: options.apiKey,
      useEdgeFunction: options.useEdgeFunction || false,
      edgeFunctionUrl: options.edgeFunctionUrl
    });
    
    this.service = new BambooHRService({
      subdomain: options.subdomain,
      apiKey: options.apiKey,
      useEdgeFunction: options.useEdgeFunction || false,
      edgeFunctionUrl: options.edgeFunctionUrl,
      client: this.client
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

  // Get trainings for a specific employee
  async getUserTrainings(employeeId: string): Promise<UserTraining[]> {
    return this.service.getUserTrainings(employeeId);
  }

  async fetchAllData(isConnectionTest = false): Promise<{ employees: Employee[], trainings: Training[], completions: TrainingCompletion[] } | null> {
    try {
      return this.service.fetchAllData(isConnectionTest);
    } catch (error) {
      console.error("Error fetching all data from BambooHR:", error);
      throw error;
    }
  }
}

export default BambooHRApi;

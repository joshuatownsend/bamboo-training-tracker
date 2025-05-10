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
  client?: any; // Add client to the interface
}

class BambooHRApi {
  private client: BambooHRClientInterface;
  private service: BambooHRService;

  constructor(options: BambooHRServiceOptions) {
    this.client = new BambooHRApiClient({
      subdomain: options.subdomain,
      apiKey: options.apiKey,
      useEdgeFunction: options.useEdgeFunction || false,
      edgeFunctionUrl: options.edgeFunctionUrl,
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
  
  // Added fetchAllTrainings method to fix the error in Courses.tsx
  async fetchAllTrainings(): Promise<Training[]> {
    console.log("Fetching all trainings with explicit /training/type endpoint");
    if (this.client.useEdgeFunction) {
      console.log(`Using edge function URL: ${this.client.edgeFunctionUrl}`);
    }
    
    try {
      const trainings = await this.service.getTrainings();
      console.log(`Fetched ${trainings.length} trainings successfully`);
      return trainings;
    } catch (error) {
      console.error("Error in fetchAllTrainings:", error);
      throw error;
    }
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

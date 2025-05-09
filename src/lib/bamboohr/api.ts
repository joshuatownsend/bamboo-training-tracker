
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
    try {
      const data = await this.client.fetchFromBamboo('/employees/directory');
      console.log("Raw employees data:", data);
      
      if (Array.isArray(data)) {
        return this.mapEmployeeData(data);
      } else if (data && typeof data === 'object' && data.employees) {
        return this.mapEmployeeData(data.employees);
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching employees:", error);
      throw error;
    }
  }
  
  private mapEmployeeData(data: any[]): Employee[] {
    return data.map(emp => ({
      id: emp.id?.toString() || '',
      name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
      position: emp.jobTitle?.name || emp.jobTitle || '',
      department: emp.department?.name || emp.department || '',
      division: emp.division?.name || emp.division || '',
      email: emp.workEmail || '',
      hireDate: emp.hireDate || '',
    }));
  }

  async fetchAllTrainings(): Promise<Training[]> {
    try {
      console.log("Fetching trainings from BambooHR...");
      const data = await this.client.fetchFromBamboo('/custom_reports/report?id=40');
      console.log("Raw trainings data:", data);
      
      if (Array.isArray(data)) {
        return this.mapTrainingData(data);
      } else if (data && typeof data === 'object') {
        // Try to find training data in different possible structures
        const trainingArray = data.trainings || data.data || data.rows || [];
        return this.mapTrainingData(trainingArray);
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching trainings:", error);
      throw error;
    }
  }
  
  private mapTrainingData(data: any[]): Training[] {
    return data.map(training => ({
      id: training.id?.toString() || '',
      title: training.name || training.title || '',
      type: training.type || 'Unknown',
      category: training.category || 'General',
      description: training.description || '',
      durationHours: parseFloat(training.duration) || 0,
      requiredFor: Array.isArray(training.requiredFor) ? training.requiredFor : [],
    }));
  }

  async fetchAllCompletions(): Promise<TrainingCompletion[]> {
    try {
      const data = await this.client.fetchFromBamboo('/custom_reports/report?id=41');
      console.log("Raw completions data:", data);
      
      if (Array.isArray(data)) {
        return this.mapCompletionData(data);
      } else if (data && typeof data === 'object') {
        // Try to find completion data in different possible structures
        const completionsArray = data.completions || data.data || data.rows || [];
        return this.mapCompletionData(completionsArray);
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching completions:", error);
      throw error;
    }
  }
  
  private mapCompletionData(data: any[]): TrainingCompletion[] {
    return data.map(completion => ({
      id: completion.id?.toString() || '',
      employeeId: completion.employeeId?.toString() || '',
      trainingId: completion.trainingId?.toString() || '',
      completionDate: completion.completedDate || '',
      expirationDate: completion.expirationDate || undefined,
      status: completion.status || 'completed',
      score: completion.score ? parseFloat(completion.score) : undefined,
      certificateUrl: completion.certificateUrl || undefined,
    }));
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

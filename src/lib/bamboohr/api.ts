import { BambooHRClient } from './client';
import { Employee, Training, TrainingCompletion } from '@/lib/types';

interface BambooHRServiceOptions {
  subdomain: string;
  apiKey: string;
  useEdgeFunction?: boolean;
  edgeFunctionUrl?: string;
}

class BambooHRService {
  private client: BambooHRClient;

  constructor(options: BambooHRServiceOptions) {
    this.client = new BambooHRClient({
      subdomain: options.subdomain,
      apiKey: options.apiKey,
      useEdgeFunction: options.useEdgeFunction || false,
      edgeFunctionUrl: options.edgeFunctionUrl
    });
  }

  async fetchAllEmployees(): Promise<Employee[]> {
    return this.client.fetch('/employees/directory');
  }

  async fetchAllTrainings(): Promise<Training[]> {
    return this.client.fetch('/custom_reports/report?id=40');
  }

  async fetchAllCompletions(): Promise<TrainingCompletion[]> {
    return this.client.fetch('/custom_reports/report?id=41');
  }

  async fetchAllData(): Promise<{ employees: Employee[], trainings: Training[], completions: TrainingCompletion[] } | null> {
    try {
      const [employees, trainings, completions] = await Promise.all([
        this.fetchAllEmployees(),
        this.fetchAllTrainings(),
        this.fetchAllCompletions()
      ]);

      return { employees, trainings, completions };
    } catch (error) {
      console.error("Error fetching all data from BambooHR:", error);
      throw error;
    }
  }
}

export default BambooHRService;

import { BambooHRClient } from './client';
import { Employee, Training, TrainingCompletion } from '@/lib/types';
import { BambooApiOptions } from './client';

// Add a new diagnostic test that directly calls the BambooHR edge function
export default class BambooHRService {
  private client: BambooHRClient;
  
  constructor(options: BambooApiOptions) {
    this.client = new BambooHRClient(options);
  }
  
  // Test connection to the BambooHR API
  async testConnection(): Promise<boolean> {
    try {
      console.log("Testing connection to BambooHR API");
      // Try to get the field list - this is a lightweight call that will validate auth
      const result = await this.client.fetchRawResponse('/meta/fields');
      
      console.log(`Test connection result: ${result.status}`);
      
      if (!result.ok) {
        const responseText = await result.text();
        console.error("BambooHR connection test failed:", result.status, responseText);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error testing connection to BambooHR:", error);
      return false;
    }
  }
  
  // Get all employees from BambooHR
  async getEmployees(): Promise<Employee[]> {
    try {
      return this.client.fetchFromBamboo('/employees/directory');
    } catch (error) {
      console.error("Error getting employees from BambooHR:", error);
      throw error;
    }
  }
  
  // Get all training data from BambooHR
  async getTrainings(): Promise<Training[]> {
    try {
      return this.client.fetchFromBamboo('/custom_reports/report?id=40');
    } catch (error) {
      console.error("Error getting trainings from BambooHR:", error);
      throw error;
    }
  }
  
  // Fetch all data (employees, trainings, completions)
  async fetchAllData(): Promise<{ employees: Employee[], trainings: Training[], completions: TrainingCompletion[] } | null> {
    try {
      console.log("Fetching all data from BambooHR");
      
      // First test connection to ensure credentials are valid
      const connectionTest = await this.testConnection();
      if (!connectionTest) {
        console.error("BambooHR connection test failed - aborting data fetch");
        throw new Error("BambooHR connection test failed. Please check your API credentials.");
      }
      
      const employees = await this.client.fetchFromBamboo('/employees/directory');
      console.log(`Fetched ${employees?.length || 0} employees from BambooHR`);
      
      // We might not have custom reports
      let trainings: Training[] = [];
      let completions: TrainingCompletion[] = [];
      
      try {
        trainings = await this.client.fetchFromBamboo('/custom_reports/report?id=40');
        console.log(`Fetched ${trainings?.length || 0} trainings from BambooHR`);
      } catch (trainingsError) {
        console.warn("Could not fetch trainings from BambooHR:", trainingsError);
      }
      
      try {
        completions = await this.client.fetchFromBamboo('/custom_reports/report?id=41');
        console.log(`Fetched ${completions?.length || 0} training completions from BambooHR`);
      } catch (completionsError) {
        console.warn("Could not fetch training completions from BambooHR:", completionsError);
      }
      
      return {
        employees: employees || [],
        trainings: trainings || [],
        completions: completions || []
      };
    } catch (error) {
      console.error("Error fetching all data from BambooHR:", error);
      throw error;
    }
  }
}

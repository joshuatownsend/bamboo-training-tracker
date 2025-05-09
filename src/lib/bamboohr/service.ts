
import { BambooHRClient } from './client';
import { Employee, Training, TrainingCompletion, UserTraining } from '@/lib/types';
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
      const directoryData = await this.client.fetchFromBamboo('/employees/directory');
      console.log("Raw employees data from BambooHR:", directoryData);
      
      // Transform BambooHR data to our Employee interface
      if (Array.isArray(directoryData)) {
        return directoryData.map((emp: any) => ({
          id: emp.id?.toString() || '',
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          position: emp.jobTitle?.name || emp.jobTitle || '',
          department: emp.department?.name || emp.department || '',
          division: emp.division?.name || emp.division || '',
          email: emp.workEmail || '',
          hireDate: emp.hireDate || '',
        }));
      } else if (directoryData && typeof directoryData === 'object') {
        // Handle case where response might have employees in a nested structure
        const employees = directoryData.employees || [];
        return employees.map((emp: any) => ({
          id: emp.id?.toString() || '',
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          position: emp.jobTitle?.name || emp.jobTitle || '',
          department: emp.department?.name || emp.department || '',
          division: emp.division?.name || emp.division || '',
          email: emp.workEmail || '',
          hireDate: emp.hireDate || '',
        }));
      }
      
      return [];
    } catch (error) {
      console.error("Error getting employees from BambooHR:", error);
      throw error;
    }
  }
  
  // Get all training data from BambooHR using the correct endpoint
  async getTrainings(): Promise<Training[]> {
    try {
      // Use the correct endpoint for training types
      const trainingsData = await this.client.fetchFromBamboo('/training/type');
      console.log("Raw trainings data from BambooHR:", trainingsData);
      
      // Handle the object format where IDs are keys
      if (trainingsData && typeof trainingsData === 'object' && !Array.isArray(trainingsData)) {
        const trainingsArray = Object.values(trainingsData);
        return trainingsArray.map((training: any) => ({
          id: training.id?.toString() || '',
          title: training.name || '',
          type: (training.category?.name?.split(' - ')[0] || '').replace(/^\d+ - /, ''),
          category: training.category?.name?.split(' - ')[1] || 'General',
          description: training.description || '',
          durationHours: parseFloat(training.hours) || 0,
          requiredFor: training.required ? ['Required'] : [],
        }));
      } 
      
      // Handle array format (fallback)
      if (Array.isArray(trainingsData)) {
        return trainingsData.map((training: any) => ({
          id: training.id?.toString() || '',
          title: training.name || '',
          type: (training.category?.name?.split(' - ')[0] || '').replace(/^\d+ - /, ''),
          category: training.category?.name?.split(' - ')[1] || 'General',
          description: training.description || '',
          durationHours: parseFloat(training.hours) || 0,
          requiredFor: training.required ? ['Required'] : [],
        }));
      }
      
      console.warn("Unexpected training data format:", trainingsData);
      return [];
    } catch (error) {
      console.error("Error getting trainings from BambooHR:", error);
      throw error;
    }
  }
  
  // Get trainings for a specific employee
  async getUserTrainings(employeeId: string): Promise<UserTraining[]> {
    try {
      console.log(`Attempting to fetch trainings for employee ID: ${employeeId}`);
      
      if (!employeeId) {
        console.error("No employee ID provided for getUserTrainings");
        return [];
      }
      
      // Use the correct endpoint for employee training records
      const endpoint = `/training/record/employee/${employeeId}?trainingTypeId=0`;
      console.log(`Using endpoint for user trainings: ${endpoint}`);
      
      const trainingData = await this.client.fetchFromBamboo(endpoint);
      console.log("Raw user trainings data from BambooHR:", trainingData);
      
      // Get all training types for reference
      const allTrainings = await this.getTrainings();
      const trainingMap = allTrainings.reduce((map, training) => {
        map[training.id] = training;
        return map;
      }, {} as Record<string, Training>);
      
      // Handle the object format where IDs are keys
      if (trainingData && typeof trainingData === 'object' && !Array.isArray(trainingData)) {
        const trainingsArray = Object.values(trainingData);
        console.log(`Found ${trainingsArray.length} training records for user`);
        
        return trainingsArray.map((record: any) => ({
          id: record.id?.toString() || '',
          employeeId: record.employeeId?.toString() || '',
          trainingId: record.type?.toString() || '',
          completionDate: record.completed || '',
          instructor: record.instructor || '',
          notes: record.notes || '',
          // Include training details if we can find them
          trainingDetails: trainingMap[record.type] || null
        }));
      }
      
      // Return empty array if no data or unexpected format
      console.warn("Unexpected user training data format:", trainingData);
      return [];
    } catch (error) {
      console.error("Error getting user trainings from BambooHR:", error);
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
      
      // Fetch raw employees data
      const rawEmployeesData = await this.client.fetchFromBamboo('/employees/directory');
      console.log(`Fetched raw employee data from BambooHR:`, rawEmployeesData);
      
      // Process employees data
      let employees: Employee[] = [];
      if (Array.isArray(rawEmployeesData)) {
        employees = rawEmployeesData.map((emp: any) => ({
          id: emp.id?.toString() || '',
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          position: emp.jobTitle?.name || emp.jobTitle || '',
          department: emp.department?.name || emp.department || '',
          division: emp.division?.name || emp.division || '',
          email: emp.workEmail || '',
          hireDate: emp.hireDate || '',
        }));
      } else if (rawEmployeesData && typeof rawEmployeesData === 'object') {
        const employeesArray = rawEmployeesData.employees || [];
        employees = employeesArray.map((emp: any) => ({
          id: emp.id?.toString() || '',
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          position: emp.jobTitle?.name || emp.jobTitle || '',
          department: emp.department?.name || emp.department || '',
          division: emp.division?.name || emp.division || '',
          email: emp.workEmail || '',
          hireDate: emp.hireDate || '',
        }));
      }
      
      console.log(`Processed ${employees.length} employees from BambooHR`);
      
      let trainings: Training[] = [];
      let completions: TrainingCompletion[] = [];
      
      try {
        // Use the correct endpoint for training types
        const rawTrainingsData = await this.client.fetchFromBamboo('/training/type');
        console.log(`Fetched raw trainings data from BambooHR:`, rawTrainingsData);
        
        // Handle the object format where IDs are keys
        if (rawTrainingsData && typeof rawTrainingsData === 'object' && !Array.isArray(rawTrainingsData)) {
          const trainingsArray = Object.values(rawTrainingsData);
          trainings = trainingsArray.map((training: any) => ({
            id: training.id?.toString() || '',
            title: training.name || '',
            type: (training.category?.name?.split(' - ')[0] || '').replace(/^\d+ - /, ''),
            category: training.category?.name?.split(' - ')[1] || 'General',
            description: training.description || '',
            durationHours: parseFloat(training.hours) || 0,
            requiredFor: training.required ? ['Required'] : [],
          }));
        } 
        // Fallback to array format
        else if (Array.isArray(rawTrainingsData)) {
          trainings = rawTrainingsData.map((training: any) => ({
            id: training.id?.toString() || '',
            title: training.name || '',
            type: (training.category?.name?.split(' - ')[0] || '').replace(/^\d+ - /, ''),
            category: training.category?.name?.split(' - ')[1] || 'General',
            description: training.description || '',
            durationHours: parseFloat(training.hours) || 0,
            requiredFor: training.required ? ['Required'] : [],
          }));
        }
        console.log(`Processed ${trainings.length} trainings from BambooHR`);
      } catch (trainingsError) {
        console.warn("Could not fetch trainings from BambooHR:", trainingsError);
      }
      
      try {
        const rawCompletionsData = await this.client.fetchFromBamboo('/custom_reports/report?id=41');
        console.log(`Fetched ${rawCompletionsData?.length || 0} training completions from BambooHR`);
        
        if (Array.isArray(rawCompletionsData)) {
          completions = rawCompletionsData.map((completion: any) => ({
            id: completion.id?.toString() || '',
            employeeId: completion.employeeId?.toString() || '',
            trainingId: completion.trainingId?.toString() || '',
            completionDate: completion.completedDate || '',
            expirationDate: completion.expirationDate || undefined,
            status: completion.status || 'completed',
            score: completion.score ? parseFloat(completion.score) : undefined,
            certificateUrl: completion.certificateUrl || undefined,
          }));
        } else if (rawCompletionsData && typeof rawCompletionsData === 'object') {
          const completionsArray = rawCompletionsData.completions || rawCompletionsData.data || [];
          completions = completionsArray.map((completion: any) => ({
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

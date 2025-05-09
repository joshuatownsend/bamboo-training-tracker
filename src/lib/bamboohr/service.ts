import { BambooHRClient } from './client';
import { Employee, Training, TrainingCompletion, UserTraining } from '@/lib/types';
import { BambooApiOptions } from './types';

class BambooHRService {
  private client: BambooHRClient;
  private subdomain: string;

  constructor(options: BambooApiOptions) {
    this.subdomain = options.subdomain;
    this.client = new BambooHRClient(options);
  }

  // Test connection to BambooHR API
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.testEndpointExists('/employees/directory');
      return response;
    } catch (error) {
      console.error('Error testing BambooHR connection:', error);
      return false;
    }
  }

  // Get all employees
  async getEmployees(): Promise<Employee[]> {
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
      return [];
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
  
  // Get all trainings
  async getTrainings(): Promise<Training[]> {
    try {
      console.log("Fetching trainings from BambooHR...");
      // Use the correct endpoint for training types
      const data = await this.client.fetchFromBamboo('/training/type');
      console.log("Raw trainings data:", data);
      
      // Handle the object format where IDs are keys
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const trainingsArray = Object.values(data);
        return this.mapTrainingData(trainingsArray);
      }
      // Handle array format (fallback)
      else if (Array.isArray(data)) {
        return this.mapTrainingData(data);
      } 
      // Handle other nested structures
      else if (data && typeof data === 'object') {
        const trainingArray = data.trainings || data.data || data.rows || [];
        return this.mapTrainingData(trainingArray);
      }
      
      console.warn("Unexpected training data format:", data);
      return [];
    } catch (error) {
      console.error("Error fetching trainings:", error);
      return [];
    }
  }
  
  private mapTrainingData(data: any[]): Training[] {
    return data.map(training => ({
      id: training.id?.toString() || '',
      title: training.name || '',
      // Extract type from category name if possible (format: "NUMBER - TYPE - CATEGORY")
      type: (training.category?.name?.split(' - ')[0] || '').replace(/^\d+ - /, ''),
      // Extract category from category name if possible
      category: training.category?.name?.split(' - ')[1] || 'General',
      description: training.description || '',
      durationHours: parseFloat(training.hours) || 0,
      // Use 'required' flag to populate requiredFor
      requiredFor: training.required ? ['Required'] : [],
    }));
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
      const endpoint = `/training/record/employee/${employeeId}`;
      console.log(`Using endpoint for user trainings: ${endpoint}`);
      
      const trainingData = await this.client.fetchFromBamboo(endpoint);
      console.log("Raw user trainings data from BambooHR:", trainingData);
      
      // Get all training types for reference
      const allTrainings = await this.getTrainings();
      const trainingMap = allTrainings.reduce((map, training) => {
        map[training.id] = training;
        return map;
      }, {} as Record<string, Training>);
      
      // Parse the response based on its format
      let trainingsArray: any[] = [];
      
      // Handle the object format where IDs are keys
      if (trainingData && typeof trainingData === 'object' && !Array.isArray(trainingData)) {
        trainingsArray = Object.values(trainingData);
      } else if (Array.isArray(trainingData)) {
        trainingsArray = trainingData;
      }
      
      console.log(`Found ${trainingsArray.length} training records for user`);
      
      if (trainingsArray.length === 0) {
        console.log("No trainings found for this employee");
        return [];
      }
      
      // Convert the data to our UserTraining format
      return trainingsArray.map((record: any) => ({
        id: record.id?.toString() || '',
        employeeId: record.employeeId?.toString() || employeeId,
        trainingId: record.type?.toString() || '',
        completionDate: record.completed || '',
        instructor: record.instructor || '',
        notes: record.notes || '',
        // Include training details if we can find them
        trainingDetails: trainingMap[record.type] || null
      }));
    } catch (error) {
      console.error("Error getting user trainings from BambooHR:", error);
      return [];
    }
  }
  
  // Get all training completions
  async getCompletions(): Promise<TrainingCompletion[]> {
    try {
      console.log("Fetching training completions from BambooHR...");
      
      // Try to use the training completion report if available (report ID 41)
      try {
        const reportData = await this.client.fetchFromBamboo('/custom_reports/report?id=41');
        console.log("Completions from custom report:", reportData);
        
        if (reportData && Array.isArray(reportData) && reportData.length > 0) {
          console.log("Using training completion report data");
          return this.mapCompletionData(reportData);
        }
      } catch (reportError) {
        console.warn("Could not fetch training completion report:", reportError);
      }
      
      // Fallback: gather training records for all employees
      const employees = await this.getEmployees();
      console.log(`Falling back to individual employee training records for ${employees.length} employees`);
      
      const allCompletions: TrainingCompletion[] = [];
      
      // For each employee, get their trainings and map to completions
      for (const employee of employees) {
        try {
          const employeeTrainings = await this.getUserTrainings(employee.id);
          console.log(`Found ${employeeTrainings.length} trainings for employee ${employee.id}`);
          
          const employeeCompletions = employeeTrainings
            .filter(training => training.completionDate) // Only include completed trainings
            .map(training => ({
              id: training.id,
              employeeId: training.employeeId,
              trainingId: training.trainingId,
              completionDate: training.completionDate,
              status: 'completed' as const,
              // Other fields can be undefined
            }));
            
          allCompletions.push(...employeeCompletions);
        } catch (error) {
          console.error(`Error getting trainings for employee ${employee.id}:`, error);
        }
      }
      
      console.log(`Total completions gathered: ${allCompletions.length}`);
      return allCompletions;
    } catch (error) {
      console.error("Error fetching training completions:", error);
      return [];
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
  
  // Fetch all data in one go
  async fetchAllData(): Promise<{ employees: Employee[], trainings: Training[], completions: TrainingCompletion[] } | null> {
    try {
      console.log("Fetching all BambooHR data...");
      
      const [employees, trainings, completions] = await Promise.all([
        this.getEmployees(),
        this.getTrainings(),
        this.getCompletions(),
      ]);
      
      console.log(`Fetched ${employees.length} employees, ${trainings.length} trainings, ${completions.length} completions`);
      
      return {
        employees,
        trainings,
        completions
      };
    } catch (error) {
      console.error("Error fetching all data:", error);
      return null;
    }
  }
}

export default BambooHRService;

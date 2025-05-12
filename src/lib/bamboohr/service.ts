
import { BambooHRClientInterface } from './client/types';
import { Employee, Training, TrainingCompletion, UserTraining } from '@/lib/types';
import { BambooApiOptions } from './types';

class BambooHRService {
  private client: BambooHRClientInterface;
  private subdomain: string;
  private trainingCache: Map<string, Training> = new Map();

  constructor(options: BambooApiOptions) {
    this.subdomain = options.subdomain;
    // Note: This assumes that the client passed in implements the BambooHRClientInterface
    this.client = options.client as unknown as BambooHRClientInterface;
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
      const data = await this.client.getEmployees();
      console.log("Raw employees data:", data);
      
      return this.mapEmployeeData(data);
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
      // Get trainings using the client
      const trainingsData = await this.client.getTrainings();
      console.log("Raw trainings data:", trainingsData);
      
      const mappedTrainings = this.mapTrainingData(trainingsData);
      
      // Cache trainings for future reference
      mappedTrainings.forEach(training => {
        this.trainingCache.set(training.id, training);
      });
      
      return mappedTrainings;
    } catch (error) {
      console.error("Error fetching trainings:", error);
      return [];
    }
  }
  
  private mapTrainingData(data: any[]): Training[] {
    return data.map(training => {
      const trainingObj: Training = {
        id: training.id?.toString() || '',
        title: training.name || `Training ${training.id}`,
        // Extract type from category name if possible (format: "NUMBER - TYPE - CATEGORY")
        type: (training.category?.name?.split(' - ')[0] || '').replace(/^\d+ - /, '') || training.id?.toString() || '',
        // Extract category from category name if possible
        category: training.category?.name?.split(' - ')[1] || training.category?.name || 'General',
        description: training.description || '',
        durationHours: parseFloat(training.hours) || 0,
        // Use 'required' flag to populate requiredFor
        requiredFor: training.required ? ['Required'] : [],
      };
      
      // Add to cache
      this.trainingCache.set(trainingObj.id, trainingObj);
      
      return trainingObj;
    });
  }
  
  // Get trainings for a specific employee with timeout
  async getUserTrainings(employeeId: string, timeoutMs = 5000): Promise<UserTraining[]> {
    try {
      console.log(`Attempting to fetch trainings for employee ID: ${employeeId}`);
      
      if (!employeeId) {
        console.error("No employee ID provided for getUserTrainings");
        return [];
      }
      
      // Get user trainings from client
      const trainingsArray = await this.client.getUserTrainings(employeeId, timeoutMs);
      console.log(`Found ${trainingsArray.length} training records for user`);
      
      if (trainingsArray.length === 0) {
        console.log("No trainings found for this employee");
        return [];
      }
      
      // Make sure training cache is populated
      if (this.trainingCache.size === 0) {
        console.log("Training cache is empty, fetching all trainings...");
        await this.getTrainings();
      }
      
      // Convert the data to our UserTraining format
      return trainingsArray.map((record: any) => {
        const trainingId = record.type?.toString() || '';
        let trainingDetails = this.trainingCache.get(trainingId);
        
        // If not found in cache, create a basic training details object
        if (!trainingDetails) {
          trainingDetails = {
            id: trainingId,
            title: record.name || `Training ${trainingId}`,
            type: trainingId,
            category: record.category || 'General',
            description: record.description || 'No description available',
            durationHours: 0,
            requiredFor: []
          };
        }
        
        return {
          id: record.id?.toString() || '',
          employeeId: record.employeeId?.toString() || employeeId,
          trainingId: trainingId,
          completionDate: record.completed || '',
          instructor: record.instructor || '',
          notes: record.notes || '',
          // Include training details
          trainingDetails: trainingDetails,
          // Pass through original fields in case they're needed
          type: record.type?.toString(),
          completed: record.completed
        };
      });
    } catch (error) {
      console.error("Error getting user trainings from BambooHR:", error);
      return [];
    }
  }
  
  // Get all training completions with improvements for the "fetch all data" test
  async getCompletions(sampleSize?: number): Promise<TrainingCompletion[]> {
    try {
      console.log("Fetching training completions from BambooHR...");
      
      // First try to use the training completion custom report if available
      try {
        console.log("Trying to get completions from custom report ID 41...");
        // Fix: Ensure proper URL format for the custom report - don't double encode the subdomain parameter
        const reportData = await this.client.fetchFromBamboo('/custom_reports/report?id=41');
        console.log("Completions from custom report:", reportData);
        
        if (reportData && Array.isArray(reportData) && reportData.length > 0) {
          console.log("Successfully retrieved training completion data from report");
          return this.mapCompletionData(reportData);
        } else {
          console.log("Custom report returned empty or invalid data, falling back to employee records");
        }
      } catch (reportError) {
        console.warn("Could not fetch training completion report:", reportError);
      }
      
      // Fallback: gather training records for all employees
      console.log("Falling back to gathering completions from individual employee records...");
      const employees = await this.getEmployees();
      
      // For connection tests, limit the number of employees we process
      const employeesToProcess = sampleSize && employees.length > sampleSize 
        ? employees.slice(0, sampleSize)
        : employees;
        
      console.log(`Will fetch training records for ${employeesToProcess.length} employees (from total ${employees.length})`);
      
      const allCompletions: TrainingCompletion[] = [];
      const batchSize = 5; // Process employees in small batches
      
      // Process employees in batches with a timeout for each employee
      for (let i = 0; i < employeesToProcess.length; i += batchSize) {
        const batch = employeesToProcess.slice(i, i + batchSize);
        console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(employeesToProcess.length/batchSize)}...`);
        
        // Process all employees in the current batch in parallel with timeouts
        const batchResults = await Promise.allSettled(
          batch.map(employee => this.getUserTrainingsWithTimeout(employee.id, 3000))
        );
        
        // Collect the results from the batch
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const employeeTrainings = result.value;
            const employee = batch[index];
            
            console.log(`Found ${employeeTrainings.length} trainings for employee ${employee.id}`);
            
            // Convert user trainings to training completions format
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
          } else {
            // This employee timed out or had an error
            console.warn(`Failed to get trainings for employee ${batch[index].id}:`, result.reason);
          }
        });
      }
      
      console.log(`Total completions gathered: ${allCompletions.length}`);
      return allCompletions;
    } catch (error) {
      console.error("Error fetching training completions:", error);
      return [];
    }
  }

  // Helper method to handle timeouts for employee training fetches
  private async getUserTrainingsWithTimeout(employeeId: string, timeoutMs: number): Promise<UserTraining[]> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.log(`Timeout reached for employee ${employeeId}`);
        resolve([]); // Resolve with empty array on timeout
      }, timeoutMs);
      
      try {
        const trainings = await this.getUserTrainings(employeeId);
        clearTimeout(timeoutId);
        resolve(trainings);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Error fetching trainings for employee ${employeeId}:`, error);
        resolve([]); // Resolve with empty array on error
      }
    });
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
  
  // Fetch all data in one go - Optimized for connection tests
  async fetchAllData(isConnectionTest = false): Promise<{ employees: Employee[], trainings: Training[], completions: TrainingCompletion[] } | null> {
    try {
      console.log(`Fetching all BambooHR data... ${isConnectionTest ? '(Connection Test Mode)' : ''}`);
      
      const [employees, trainings] = await Promise.all([
        this.getEmployees(),
        this.getTrainings(),
      ]);
      
      console.log(`Fetched ${employees.length} employees, ${trainings.length} trainings`);
      
      // For connection tests, use limited sample size to make it faster
      let completions: TrainingCompletion[] = [];
      if (isConnectionTest) {
        console.log("Running in connection test mode - using reduced sample size");
        // Use a very small sample size for connection tests (5 employees)
        completions = await this.getCompletions(5);
      } else {
        // Normal operation - fetch all completions
        completions = await this.getCompletions();
      }
      
      console.log(`Fetched ${completions.length} completions`);
      
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

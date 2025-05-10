import { BambooHRClient } from './base';
import { BambooApiOptions } from './types';

/**
 * BambooHR API client
 * This extends the base client with specific API methods for BambooHR
 */
export class BambooHRApiClient extends BambooHRClient {
  constructor(options: BambooApiOptions) {
    super(options);
  }
  
  /**
   * Get the client instance for direct access
   */
  getClient(): BambooHRClient {
    return this;
  }

  /**
   * Fetch all data from BambooHR: employees, trainings, and training completions
   * @param isConnectionTest If true, use a reduced data set for connection testing
   * @returns Object with employees, trainings, and completions arrays
   */
  async fetchAllData(isConnectionTest = false) {
    console.log(`Fetching all BambooHR data... ${isConnectionTest ? '(Connection Test Mode)' : ''}`);
    
    try {
      // Use Promise.allSettled to collect as much data as possible, even if some requests fail
      const [employeesResult, trainingsResult] = await Promise.allSettled([
        this.getEmployees(),
        this.getTrainings()
      ]);
      
      const employees = employeesResult.status === 'fulfilled' ? employeesResult.value : [];
      const trainings = trainingsResult.status === 'fulfilled' ? trainingsResult.value : [];
      
      console.log(`Fetched ${employees.length} employees, ${trainings.length} trainings`);
      
      // For completions, we'll try a custom report first, then individual employee records as fallback
      let completions: any[] = [];
      let partialData = false;
      let errorInfo = null;
      
      try {
        // First attempt: Try to get from custom report
        console.log("Attempting to fetch training completions from custom report...");
        completions = await this.getTrainingCompletions(isConnectionTest ? 5 : undefined);
      } catch (error) {
        console.warn("Failed to get training completions:", error);
        partialData = true;
        errorInfo = error instanceof Error ? error.message : 'Unknown error';
        
        // Second attempt: Try to get completions for individual employees
        if (employees.length > 0) {
          try {
            console.log("Falling back to fetching individual employee training records...");
            
            // Only get for a small subset in connection test mode
            const employeesToProcess = isConnectionTest ? employees.slice(0, 5) : employees;
            const batchSize = 5;
            let batchedCompletions: any[] = [];
            
            // Process employees in small batches to avoid overwhelming the API
            for (let i = 0; i < employeesToProcess.length; i += batchSize) {
              const batch = employeesToProcess.slice(i, i + batchSize);
              console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(employeesToProcess.length/batchSize)}`);
              
              const batchPromises = batch.map(employee => {
                return this.getUserTrainings(employee.id.toString(), 3000)
                  .then(trainings => {
                    // Map user trainings to completions format
                    return trainings.map(training => ({
                      id: training.id || `${employee.id}-${training.type}`,
                      employeeId: employee.id.toString(),
                      trainingId: training.type?.toString() || '',
                      completionDate: training.completed || '',
                      status: 'completed',
                    }));
                  })
                  .catch(err => {
                    console.warn(`Failed to get trainings for employee ${employee.id}:`, err);
                    return [];
                  });
              });
              
              const batchResults = await Promise.allSettled(batchPromises);
              batchResults.forEach(result => {
                if (result.status === 'fulfilled') {
                  batchedCompletions = [...batchedCompletions, ...result.value];
                }
              });
            }
            
            completions = batchedCompletions;
            console.log(`Fetched ${completions.length} completions via individual employee records`);
          } catch (fallbackError) {
            console.error("Fallback approach also failed:", fallbackError);
          }
        }
      }
      
      console.log(`Fetched ${completions.length} completions`);
      
      return {
        employees,
        trainings,
        completions,
        partialData,
        error: errorInfo
      };
    } catch (error) {
      console.error("Error fetching all data:", error);
      throw error;
    }
  }

  /**
   * Get all training completions with improvements for the "fetch all data" test
   * @param sampleSize Optional limit to the number of employees to process
   * @returns Array of training completion records
   */
  async getTrainingCompletions(sampleSize?: number): Promise<any[]> {
    try {
      console.log("Fetching training completions from BambooHR...");
      
      // First try to use the training completion custom report if available
      try {
        console.log("Trying to get completions from custom report ID 41...");
        const reportData = await this.fetchFromBamboo('/custom_reports/report?id=41');
        
        if (reportData && Array.isArray(reportData) && reportData.length > 0) {
          console.log("Successfully retrieved training completion data from report");
          return reportData;
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
      
      const allCompletions: any[] = [];
      const batchSize = 5; // Process employees in small batches
      
      // Process employees in batches with a timeout for each employee
      for (let i = 0; i < employeesToProcess.length; i += batchSize) {
        const batch = employeesToProcess.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(employeesToProcess.length/batchSize)}...`);
        
        // Process all employees in the current batch in parallel with timeouts
        const batchResults = await Promise.allSettled(
          batch.map(employee => this.getUserTrainings(employee.id.toString(), 3000))
        );
        
        // Collect the results from the batch
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const employeeTrainings = result.value;
            const employee = batch[index];
            
            if (!employee || !employee.id) {
              console.warn("Invalid employee record in batch");
              return;
            }
            
            console.log(`Found ${employeeTrainings.length} trainings for employee ${employee.id}`);
            
            // Convert user trainings to training completions format
            const employeeCompletions = employeeTrainings
              .filter(training => training.completed) // Only include completed trainings
              .map(training => ({
                id: training.id || `${employee.id}-${training.type}`,
                employeeId: employee.id.toString(),
                trainingId: training.type?.toString() || '',
                completionDate: training.completed || '',
                status: 'completed',
                // Other fields can be undefined
              }));
              
            allCompletions.push(...employeeCompletions);
          } else {
            // This employee timed out or had an error
            console.warn(`Failed to get trainings for employee ${batch[index]?.id || 'unknown'}:`, result.reason);
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

  /**
   * Get all trainings with proper error handling
   * Uses the correct /training/type endpoint
   */
  async getTrainings(): Promise<any[]> {
    try {
      console.log("BambooHRApiClient: Fetching trainings using /training/type endpoint");
      const trainings = await this.fetchFromBamboo('/training/type');
      
      if (!trainings) {
        console.warn("No trainings returned from BambooHR API");
        return [];
      }
      
      if (!Array.isArray(trainings)) {
        console.warn("Trainings response is not an array:", typeof trainings);
        // If it's an object but not an array, try to extract values
        if (typeof trainings === 'object') {
          const extracted = Object.values(trainings);
          if (Array.isArray(extracted) && extracted.length > 0) {
            console.log(`Extracted ${extracted.length} trainings from object response`);
            return extracted;
          }
        }
        return [];
      }
      
      console.log(`Successfully fetched ${trainings.length} trainings from BambooHR`);
      return trainings;
    } catch (error) {
      console.error("Error in getTrainings:", error);
      return [];
    }
  }
}

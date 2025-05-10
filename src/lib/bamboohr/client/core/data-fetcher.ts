
import { ConnectionTester } from './connection-tester';

/**
 * Handles BambooHR data fetching for employees and trainings
 */
export class DataFetcher extends ConnectionTester {
  /**
   * Get all employees from BambooHR
   * @returns Array of employee records
   */
  async getEmployees(): Promise<any[]> {
    try {
      console.log("Fetching employees from BambooHR");
      const directory = await this.fetchFromBamboo('/employees/directory');
      
      if (!directory || !Array.isArray(directory.employees)) {
        console.warn("Invalid employee directory response format:", directory);
        
        // Try to process the raw response in case it's structured differently
        if (directory && typeof directory === 'object') {
          if ('employees' in directory && Array.isArray(directory.employees)) {
            console.log(`Found ${directory.employees.length} employees in directory`);
            return directory.employees;
          } else {
            // Maybe the directory itself is an array
            const possibleEmployees = Object.values(directory).filter(Array.isArray);
            if (possibleEmployees.length > 0) {
              const employees = possibleEmployees[0];
              console.log(`Found ${employees.length} employees through alternative parsing`);
              return employees;
            }
          }
        }
        
        return [];
      }
      
      console.log(`Found ${directory.employees.length} employees in directory`);
      return directory.employees;
    } catch (error) {
      console.error("Error fetching employees:", error);
      // Fallback to smaller employee directory if available
      try {
        console.log("Trying alternative employee directory endpoint");
        const directoryAlt = await this.fetchFromBamboo('/employees');
        
        if (!directoryAlt) {
          console.warn("Invalid alternative employee directory response");
          return [];
        }
        
        // Handle both array and object formats
        if (Array.isArray(directoryAlt)) {
          console.log(`Found ${directoryAlt.length} employees in alternative directory (array format)`);
          return directoryAlt;
        } else if (typeof directoryAlt === 'object') {
          const employees = Object.values(directoryAlt);
          console.log(`Found ${employees.length} employees in alternative directory (object format)`);
          return employees;
        }
        
        return [];
      } catch (fallbackError) {
        console.error("Fallback employee fetch also failed:", fallbackError);
        return [];
      }
    }
  }
  
  /**
   * Get all trainings from BambooHR
   * @returns Array of training records
   */
  async getTrainings(): Promise<any[]> {
    try {
      console.log("Fetching trainings from BambooHR");
      
      // Update to use the correct endpoint: /training/type instead of /training/catalog
      const trainings = await this.fetchFromBamboo('/training/type');
      
      if (!trainings || !Array.isArray(trainings)) {
        console.warn("Invalid trainings response:", trainings);
        return [];
      }
      
      console.log(`Found ${trainings.length} trainings in catalog`);
      return trainings;
    } catch (error) {
      console.error("Error fetching trainings:", error);
      return [];
    }
  }
  
  /**
   * Get trainings for a specific employee
   * @param employeeId Employee ID
   * @param timeoutMs Timeout in milliseconds
   * @returns Array of training records for the employee
   */
  async getUserTrainings(employeeId: string, timeoutMs: number = 5000): Promise<any[]> {
    try {
      console.log(`Fetching trainings for employee ID: ${employeeId}`);
      
      // Try to get trainings from training/record/employee first
      try {
        const trainings = await this.fetchWithTimeout(
          `/training/record/employee/${employeeId}`, 
          {}, 
          timeoutMs
        );
        
        if (trainings && Object.keys(trainings).length > 0) {
          console.log(`Found ${Object.keys(trainings).length} training records for employee ${employeeId}`);
          
          // Convert object format to array for consistency
          const trainingArray = Object.values(trainings);
          return trainingArray.map((training: any) => ({
            ...training,
            trainingDetails: this.getTrainingDetailsById(training?.type)
          }));
        } else {
          console.log("Training records endpoint returned empty data, trying alternatives");
        }
      } catch (trainingError) {
        console.warn(`Error fetching employee training records: ${trainingError instanceof Error ? trainingError.message : 'Unknown error'}, trying alternatives`);
      }
      
      // Try to get trainings from tables/trainingCompleted
      try {
        const completedTrainings = await this.fetchWithTimeout(
          `/employees/${employeeId}/tables/trainingCompleted`,
          {},
          timeoutMs
        );
        
        if (completedTrainings && Object.keys(completedTrainings).length > 0) {
          console.log(`Found ${Object.keys(completedTrainings).length} completed trainings for employee ${employeeId}`);
          
          // Convert object format to array for consistency
          const trainingArray = Object.values(completedTrainings);
          return trainingArray.map((training: any) => ({
            ...training,
            trainingDetails: this.getTrainingDetailsById(training?.type)
          }));
        } else {
          console.log("Training completed table returned empty data, trying next alternative");
        }
      } catch (completedError) {
        console.warn(`Error fetching employee completed trainings: ${completedError instanceof Error ? completedError.message : 'Unknown error'}, trying last alternative`);
      }
      
      // Try certifications table as last resort
      try {
        const certifications = await this.fetchWithTimeout(
          `/employees/${employeeId}/tables/certifications`,
          {},
          timeoutMs
        );
        
        if (certifications && Object.keys(certifications).length > 0) {
          console.log(`Found ${Object.keys(certifications).length} certifications for employee ${employeeId}`);
          
          // Convert object format to array for consistency
          const certArray = Object.values(certifications);
          return certArray.map((cert: any) => ({
            ...cert,
            trainingDetails: this.getTrainingDetailsById(cert?.type)
          }));
        } else {
          console.log("Certifications table returned empty data");
        }
      } catch (certError) {
        console.warn(`Error fetching employee certifications: ${certError instanceof Error ? certError.message : 'Unknown error'}`);
      }
      
      console.info(`No training records found for employee ${employeeId}`);
      return [];
    } catch (error) {
      console.error(`Error in getUserTrainings for employee ${employeeId}:`, error);
      return [];
    }
  }
  
  /**
   * Get training details by training ID
   * @param trainingId Training/certification ID
   * @returns Training details object or null
   */
  private getTrainingDetailsById(trainingId?: string | number): any | null {
    try {
      if (!trainingId) return null;
      
      // You might want to implement caching for this
      // This is a placeholder implementation
      return { 
        id: trainingId,
        title: `Training ${trainingId}`,
        category: 'Unknown' 
      };
    } catch (error) {
      console.warn(`Could not get training details for ID ${trainingId}:`, error);
      return null;
    }
  }
}

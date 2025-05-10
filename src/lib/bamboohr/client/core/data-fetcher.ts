
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
        console.warn("Invalid employee directory response:", directory);
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
        
        if (!directoryAlt || !Array.isArray(directoryAlt)) {
          console.warn("Invalid alternative employee directory response");
          return [];
        }
        
        console.log(`Found ${directoryAlt.length} employees in alternative directory`);
        return directoryAlt;
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
      
      // Try to get trainings from training catalog
      const trainings = await this.fetchFromBamboo('/training/catalog');
      
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
        
        if (trainings && Array.isArray(trainings)) {
          console.log(`Found ${trainings.length} training records for employee ${employeeId}`);
          return trainings;
        } else {
          console.log("Training records endpoint returned invalid data, trying alternative");
        }
      } catch (trainingError) {
        console.warn(`Error fetching employee training records: ${trainingError.message}, trying alternatives`);
      }
      
      // Try to get trainings from tables/trainingCompleted
      try {
        const completedTrainings = await this.fetchWithTimeout(
          `/employees/${employeeId}/tables/trainingCompleted`,
          {},
          timeoutMs
        );
        
        if (completedTrainings && Array.isArray(completedTrainings)) {
          console.log(`Found ${completedTrainings.length} completed trainings for employee ${employeeId}`);
          return completedTrainings;
        } else {
          console.log("Training completed table returned invalid data, trying next alternative");
        }
      } catch (completedError) {
        console.warn(`Error fetching employee completed trainings: ${completedError.message}, trying last alternative`);
      }
      
      // Try certifications table as last resort
      try {
        const certifications = await this.fetchWithTimeout(
          `/employees/${employeeId}/tables/certifications`,
          {},
          timeoutMs
        );
        
        if (certifications && Array.isArray(certifications)) {
          console.log(`Found ${certifications.length} certifications for employee ${employeeId}`);
          return certifications;
        } else {
          console.log("Certifications table returned invalid data");
        }
      } catch (certError) {
        console.warn(`Error fetching employee certifications: ${certError.message}`);
      }
      
      console.info(`No training records found for employee ${employeeId}`);
      return [];
    } catch (error) {
      console.error(`Error in getUserTrainings for employee ${employeeId}:`, error);
      return [];
    }
  }
}

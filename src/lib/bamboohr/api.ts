import { BambooApiOptions, BambooEmployee, BambooTraining, BambooTrainingCompletion } from "./types";
import { Employee, Training, TrainingCompletion } from "../types";
import { getEffectiveBambooConfig } from "./config";

class BambooHRService {
  private apiKey: string;
  private subdomain: string;
  private useProxy: boolean;

  constructor(options: BambooApiOptions) {
    this.apiKey = options.apiKey;
    this.subdomain = options.subdomain;
    this.useProxy = true; // Default to using the proxy
    console.log(`BambooHR service initialized with subdomain: ${options.subdomain}`);
  }

  private async fetchFromBamboo(endpoint: string, method = 'GET', body?: any) {
    const headers = new Headers();
    
    let url: string;
    
    if (this.useProxy) {
      // Use our proxy endpoint
      url = `/api/bamboohr/api/gateway.php/${this.subdomain}/v1${endpoint}`;
      // Add auth header that the server will forward
      headers.append("X-BambooHR-ApiKey", this.apiKey);
    } else {
      // Direct API access (will fail in browser due to CORS)
      url = `https://api.bamboohr.com/api/gateway.php/${this.subdomain}/v1${endpoint}`;
      // Base64 encode API key with empty username as per BambooHR docs
      const authHeader = "Basic " + btoa(`${this.apiKey}:`);
      headers.append("Authorization", authHeader);
    }
    
    headers.append("Accept", "application/json");
    
    if (method !== 'GET' && body) {
      headers.append("Content-Type", "application/json");
    }

    console.log(`BambooHR API request: ${method} ${url}`);
    
    // Log headers (redacting sensitive info)
    const headerObj: Record<string, string> = {};
    headers.forEach((value, key) => {
      headerObj[key] = key === 'Authorization' || key === 'X-BambooHR-ApiKey' ? '[REDACTED]' : value;
    });
    console.log('Request headers:', headerObj);
    
    try {
      console.log(`Sending request to BambooHR API: ${method} ${url}`);
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`BambooHR API error (${response.status}): ${errorText || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in BambooHR API call to ${endpoint}:`, error);
      
      // If using proxy fails, we won't automatically try direct access
      // as it will definitely fail in the browser
      
      throw error;
    }
  }

  // Test connection - used just to verify credentials
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing BambooHR connection...');
      
      // Use a simple endpoint to test the connection
      const response = await this.fetchFromBamboo('/employees/directory?limit=1');
      console.log('BambooHR connection test successful, received data:', response);
      return true;
    } catch (error) {
      console.error('BambooHR connection test failed:', error);
      throw error;
    }
  }

  // Fetch all employees
  async getEmployees(): Promise<Employee[]> {
    try {
      const fields = [
        "id", 
        "displayName", 
        "firstName", 
        "lastName", 
        "jobTitle", 
        "department", 
        "workEmail", 
        "hireDate", 
        "photoUrl"
      ].join(",");

      const response = await this.fetchFromBamboo(`/employees/directory?fields=${fields}`);
      
      // Map BambooHR employees to our Employee type
      return response.employees.map((emp: BambooEmployee) => ({
        id: emp.id,
        name: emp.displayName || `${emp.firstName} ${emp.lastName}`,
        position: emp.jobTitle?.name || "Volunteer",
        department: emp.department?.name || "General",
        email: emp.workEmail,
        avatar: emp.photoUrl,
        hireDate: emp.hireDate
      }));
    } catch (error) {
      console.error('Error fetching employees from BambooHR:', error);
      
      // For CORS errors during actual data fetching, return empty array but log it clearly
      if (error instanceof Error && error.message.includes('CORS')) {
        console.warn('CORS error during employee fetch - returning empty array');
        return [];
      }
      
      throw error;
    }
  }

  // Fetch a single employee by ID
  async getEmployee(id: string): Promise<Employee> {
    try {
      const response = await this.fetchFromBamboo(`/employees/${id}?fields=displayName,firstName,lastName,jobTitle,department,workEmail,hireDate,photoUrl`);
      
      return {
        id: response.id,
        name: response.displayName || `${response.firstName} ${response.lastName}`,
        position: response.jobTitle?.name || "Volunteer",
        department: response.department?.name || "General",
        email: response.workEmail,
        avatar: response.photoUrl,
        hireDate: response.hireDate
      };
    } catch (error) {
      console.error(`Error fetching employee ${id} from BambooHR:`, error);
      throw error;
    }
  }

  // Fetch all trainings
  async getTrainings(): Promise<Training[]> {
    try {
      // Note: This endpoint might differ based on BambooHR's actual API or custom tables setup
      const response = await this.fetchFromBamboo('/meta/training');
      
      return response.trainings.map((training: BambooTraining) => ({
        id: training.id,
        title: training.name,
        type: training.type,
        category: training.category,
        description: training.description,
        durationHours: training.duration,
        requiredFor: training.requiredFor
      }));
    } catch (error) {
      console.error('Error fetching trainings from BambooHR:', error);
      
      // If the endpoint is not found, we might be hitting the wrong API
      // Return mock data as a fallback for testing
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('CORS'))) {
        console.warn('Training endpoint not found or CORS error - BambooHR API structure may differ from expected');
        return [];
      }
      
      throw error;
    }
  }

  // Fetch training completions for an employee
  async getTrainingCompletions(employeeId: string): Promise<TrainingCompletion[]> {
    try {
      // Note: This endpoint might differ based on BambooHR's actual API or custom tables setup
      const response = await this.fetchFromBamboo(`/employees/${employeeId}/trainings`);
      
      return response.trainings.map((completion: BambooTrainingCompletion) => ({
        id: completion.id,
        employeeId: completion.employeeId,
        trainingId: completion.trainingId,
        completionDate: completion.completedDate,
        expirationDate: completion.expirationDate,
        status: this.mapTrainingStatus(completion.status, completion.expirationDate),
        score: completion.score,
        certificateUrl: completion.certificateUrl
      }));
    } catch (error) {
      console.error(`Error fetching training completions for employee ${employeeId}:`, error);
      
      // If the endpoint is not found, we might be hitting the wrong API
      // Return empty array as a fallback
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('CORS'))) {
        console.warn('Training completions endpoint not found or CORS error - BambooHR API structure may differ from expected');
        return [];
      }
      
      throw error;
    }
  }

  // Map BambooHR status to our status format
  private mapTrainingStatus(status: string, expirationDate?: string): 'completed' | 'expired' | 'due' {
    if (status.toLowerCase() !== 'completed') {
      return 'due';
    }
    
    if (expirationDate) {
      const now = new Date();
      const expiration = new Date(expirationDate);
      
      if (expiration < now) {
        return 'expired';
      }
    }
    
    return 'completed';
  }

  // Fetch all data needed for the app
  async fetchAllData() {
    console.log('Fetching all BambooHR data with config:', {
      subdomain: getEffectiveBambooConfig().subdomain,
      apiKey: getEffectiveBambooConfig().apiKey ? '[REDACTED]' : null
    });
    
    try {
      console.log('Step 1: Fetching employees...');
      const employees = await this.getEmployees();
      console.log(`Successfully fetched ${employees.length} employees`);
      
      let trainings: Training[] = [];
      let allCompletions: TrainingCompletion[] = [];
      
      try {
        console.log('Step 2: Fetching trainings...');
        trainings = await this.getTrainings();
        console.log(`Successfully fetched ${trainings.length} trainings`);
      } catch (error) {
        console.error('Failed to fetch trainings, continuing with empty list:', error);
      }
      
      // Get training completions for all employees
      // Note: This might be inefficient for large organizations, consider pagination
      try {
        console.log('Step 3: Fetching training completions for all employees...');
        const completionsPromises = employees.map(employee => {
          console.log(`Fetching training completions for employee ${employee.id}...`);
          return this.getTrainingCompletions(employee.id)
            .catch(error => {
              console.error(`Failed to fetch completions for employee ${employee.id}:`, error);
              return [];
            });
        });
        
        allCompletions = (await Promise.all(completionsPromises)).flat();
        console.log(`Successfully fetched ${allCompletions.length} training completions`);
      } catch (error) {
        console.error('Failed to fetch training completions, continuing with empty list:', error);
      }
      
      const result = {
        employees,
        trainings,
        completions: allCompletions
      };
      
      console.log('All data fetched successfully. Summary:', {
        employeesCount: employees.length,
        trainingsCount: trainings.length,
        completionsCount: allCompletions.length
      });
      
      return result;
    } catch (error) {
      console.error('Error fetching all data from BambooHR:', error);
      throw error;
    }
  }
}

export default BambooHRService;

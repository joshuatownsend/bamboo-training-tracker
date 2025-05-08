
import { BambooApiOptions, BambooEmployee, BambooTraining, BambooTrainingCompletion } from "./types";
import { Employee, Training, TrainingCompletion } from "../types";

class BambooHRService {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: BambooApiOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = `https://api.bamboohr.com/api/gateway.php/${options.subdomain}/v1`;
  }

  private async fetchFromBamboo(endpoint: string, method = 'GET', body?: any) {
    const headers = new Headers();
    // Base64 encode API key with empty username as per BambooHR docs
    const authHeader = "Basic " + btoa(`${this.apiKey}:`);
    headers.append("Authorization", authHeader);
    headers.append("Accept", "application/json");
    
    if (method !== 'GET' && body) {
      headers.append("Content-Type", "application/json");
    }

    console.log(`BambooHR API request: ${method} ${this.baseUrl}${endpoint}`);
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`BambooHR API error (${response.status}):`, errorText);
        throw new Error(`BambooHR API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`BambooHR API response for ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`Error in BambooHR API call to ${endpoint}:`, error);
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
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('Training endpoint not found - BambooHR API structure may differ from expected');
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
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('Training completions endpoint not found - BambooHR API structure may differ from expected');
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
    try {
      const employees = await this.getEmployees();
      
      let trainings: Training[] = [];
      let allCompletions: TrainingCompletion[] = [];
      
      try {
        trainings = await this.getTrainings();
      } catch (error) {
        console.error('Failed to fetch trainings, continuing with empty list:', error);
      }
      
      // Get training completions for all employees
      // Note: This might be inefficient for large organizations, consider pagination
      try {
        const completionsPromises = employees.map(employee => 
          this.getTrainingCompletions(employee.id)
            .catch(error => {
              console.error(`Failed to fetch completions for employee ${employee.id}:`, error);
              return [];
            })
        );
        
        allCompletions = (await Promise.all(completionsPromises)).flat();
      } catch (error) {
        console.error('Failed to fetch training completions, continuing with empty list:', error);
      }
      
      return {
        employees,
        trainings,
        completions: allCompletions
      };
    } catch (error) {
      console.error('Error fetching all data from BambooHR:', error);
      throw error;
    }
  }
}

export default BambooHRService;

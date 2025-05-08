
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

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BambooHR API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  // Fetch all employees
  async getEmployees(): Promise<Employee[]> {
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
      name: emp.displayName,
      position: emp.jobTitle?.name || "Volunteer",
      department: emp.department?.name || "General",
      email: emp.workEmail,
      avatar: emp.photoUrl,
      hireDate: emp.hireDate
    }));
  }

  // Fetch a single employee by ID
  async getEmployee(id: string): Promise<Employee> {
    const response = await this.fetchFromBamboo(`/employees/${id}?fields=displayName,firstName,lastName,jobTitle,department,workEmail,hireDate,photoUrl`);
    
    return {
      id: response.id,
      name: response.displayName,
      position: response.jobTitle?.name || "Volunteer",
      department: response.department?.name || "General",
      email: response.workEmail,
      avatar: response.photoUrl,
      hireDate: response.hireDate
    };
  }

  // Fetch all trainings
  async getTrainings(): Promise<Training[]> {
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
  }

  // Fetch training completions for an employee
  async getTrainingCompletions(employeeId: string): Promise<TrainingCompletion[]> {
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
    const employees = await this.getEmployees();
    const trainings = await this.getTrainings();
    
    // Get training completions for all employees
    // Note: This might be inefficient for large organizations, consider pagination
    const completionsPromises = employees.map(employee => 
      this.getTrainingCompletions(employee.id)
    );
    
    const allCompletions = (await Promise.all(completionsPromises)).flat();
    
    return {
      employees,
      trainings,
      completions: allCompletions
    };
  }
}

export default BambooHRService;

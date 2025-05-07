
import { 
  Employee, 
  Training, 
  TrainingCompletion, 
  TrainingStatistics 
} from "./types";

// Mock Employees
export const employees: Employee[] = [
  {
    id: "emp-001",
    name: "Alex Johnson",
    position: "Software Developer",
    department: "Engineering",
    email: "alex.johnson@example.com",
    hireDate: "2021-03-15"
  },
  {
    id: "emp-002",
    name: "Morgan Smith",
    position: "HR Specialist",
    department: "Human Resources",
    email: "morgan.smith@example.com",
    hireDate: "2020-07-10"
  },
  {
    id: "emp-003",
    name: "Taylor Wilson",
    position: "Marketing Manager",
    department: "Marketing",
    email: "taylor.wilson@example.com",
    hireDate: "2019-11-05"
  },
  {
    id: "emp-004",
    name: "Jordan Rivera",
    position: "Finance Analyst",
    department: "Finance",
    email: "jordan.rivera@example.com",
    hireDate: "2022-01-20"
  },
  {
    id: "emp-005",
    name: "Casey Brown",
    position: "Product Manager",
    department: "Product",
    email: "casey.brown@example.com",
    hireDate: "2021-09-12"
  },
  {
    id: "emp-006",
    name: "Riley Davis",
    position: "UX Designer",
    department: "Design",
    email: "riley.davis@example.com",
    hireDate: "2020-05-18"
  },
  {
    id: "emp-007",
    name: "Jamie Miller",
    position: "Customer Support",
    department: "Support",
    email: "jamie.miller@example.com",
    hireDate: "2022-02-28"
  },
  {
    id: "emp-008",
    name: "Avery Garcia",
    position: "Sales Representative",
    department: "Sales",
    email: "avery.garcia@example.com",
    hireDate: "2021-06-07"
  }
];

// Mock Training Courses
export const trainings: Training[] = [
  {
    id: "trn-001",
    title: "Cybersecurity Fundamentals",
    type: "Compliance",
    category: "Security",
    description: "Basic security training for all employees",
    durationHours: 2,
    requiredFor: ["Engineering", "Human Resources", "Marketing", "Finance", "Product", "Design", "Support", "Sales"]
  },
  {
    id: "trn-002",
    title: "Data Privacy Compliance",
    type: "Compliance",
    category: "Legal",
    description: "GDPR and data protection regulations training",
    durationHours: 1.5,
    requiredFor: ["Human Resources", "Marketing", "Finance"]
  },
  {
    id: "trn-003",
    title: "Agile Methodology",
    type: "Professional",
    category: "Development",
    description: "Introduction to Agile development practices",
    durationHours: 4,
    requiredFor: ["Engineering", "Product"]
  },
  {
    id: "trn-004",
    title: "Leadership Skills",
    type: "Soft Skills",
    category: "Management",
    description: "Essential leadership skills for managers",
    durationHours: 6,
    requiredFor: ["Engineering", "Human Resources", "Marketing", "Finance", "Product"]
  },
  {
    id: "trn-005",
    title: "Customer Service Excellence",
    type: "Soft Skills",
    category: "Customer Relations",
    description: "Providing excellent customer service",
    durationHours: 3,
    requiredFor: ["Support", "Sales"]
  },
  {
    id: "trn-006",
    title: "Financial Compliance",
    type: "Compliance",
    category: "Finance",
    description: "Financial regulations and compliance",
    durationHours: 2.5,
    requiredFor: ["Finance"]
  },
  {
    id: "trn-007",
    title: "Design Thinking",
    type: "Professional",
    category: "Design",
    description: "Creative problem-solving approach",
    durationHours: 5,
    requiredFor: ["Design", "Product", "Engineering"]
  },
];

// Mock Training Completions
export const trainingCompletions: TrainingCompletion[] = [
  {
    id: "cmp-001",
    employeeId: "emp-001",
    trainingId: "trn-001",
    completionDate: "2023-02-15",
    expirationDate: "2024-02-15",
    status: "completed"
  },
  {
    id: "cmp-002",
    employeeId: "emp-001",
    trainingId: "trn-003",
    completionDate: "2023-04-20",
    status: "completed",
    score: 95
  },
  {
    id: "cmp-003",
    employeeId: "emp-002",
    trainingId: "trn-001",
    completionDate: "2023-01-10",
    expirationDate: "2024-01-10",
    status: "completed"
  },
  {
    id: "cmp-004",
    employeeId: "emp-002",
    trainingId: "trn-002",
    completionDate: "2023-03-05",
    status: "completed",
    score: 88
  },
  {
    id: "cmp-005",
    employeeId: "emp-003",
    trainingId: "trn-001",
    completionDate: "2022-11-30",
    expirationDate: "2023-11-30",
    status: "completed"
  },
  {
    id: "cmp-006",
    employeeId: "emp-003",
    trainingId: "trn-002",
    completionDate: "2022-12-15",
    status: "completed",
    score: 92
  },
  {
    id: "cmp-007",
    employeeId: "emp-004",
    trainingId: "trn-001",
    completionDate: "2023-05-08",
    expirationDate: "2024-05-08",
    status: "completed"
  },
  {
    id: "cmp-008",
    employeeId: "emp-004",
    trainingId: "trn-006",
    completionDate: "2023-06-12",
    status: "completed",
    score: 90
  },
  {
    id: "cmp-009",
    employeeId: "emp-005",
    trainingId: "trn-001",
    completionDate: "2022-10-05",
    expirationDate: "2023-10-05",
    status: "expired"
  },
  {
    id: "cmp-010",
    employeeId: "emp-005",
    trainingId: "trn-004",
    status: "due",
  },
];

// Helper functions to get training statistics
export const getTrainingStatistics = (): TrainingStatistics => {
  const totalRequired = employees.length * trainings.filter(t => t.type === "Compliance").length;
  const completed = trainingCompletions.filter(tc => tc.status === "completed").length;
  const expired = trainingCompletions.filter(tc => tc.status === "expired").length;
  const upcoming = trainingCompletions.filter(tc => tc.status === "due").length;
  
  // Calculate department statistics
  const departments = [...new Set(employees.map(e => e.department))];
  const departmentStats = departments.map(dept => {
    const deptEmployees = employees.filter(e => e.department === dept);
    const requiredTrainings = trainings.filter(t => t.requiredFor.includes(dept));
    const totalRequired = deptEmployees.length * requiredTrainings.length;
    
    let completedCount = 0;
    deptEmployees.forEach(emp => {
      requiredTrainings.forEach(trn => {
        const completion = trainingCompletions.find(
          tc => tc.employeeId === emp.id && tc.trainingId === trn.id && tc.status === "completed"
        );
        if (completion) completedCount++;
      });
    });
    
    return {
      department: dept,
      completedCount,
      totalRequired,
      complianceRate: totalRequired > 0 ? (completedCount / totalRequired) * 100 : 0
    };
  });
  
  return {
    totalTrainings: trainings.length,
    completedTrainings: completed,
    expiredTrainings: expired,
    upcomingTrainings: upcoming,
    completionRate: totalRequired > 0 ? (completed / totalRequired) * 100 : 0,
    departmentStats
  };
};

// Helper function to get employee training status
export const getEmployeeTrainingStatus = (employeeId: string) => {
  const employee = employees.find(e => e.id === employeeId);
  if (!employee) return null;
  
  const requiredTrainings = trainings.filter(t => 
    t.requiredFor.includes(employee.department)
  );
  
  return requiredTrainings.map(training => {
    const completion = trainingCompletions.find(
      tc => tc.employeeId === employeeId && tc.trainingId === training.id
    );
    
    return {
      training,
      completion: completion || {
        id: "",
        employeeId,
        trainingId: training.id,
        status: "due" as const
      }
    };
  });
};

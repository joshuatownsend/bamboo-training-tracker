
import { 
  Employee, 
  Training, 
  TrainingCompletion, 
  DepartmentStats,
  TrainingStatistics,
  Position
} from "./types";

// Mock Employees
export const employees: Employee[] = [
  {
    id: "emp-1",
    name: "John Doe",
    position: "Firefighter",
    department: "Fire Operations",
    email: "john.doe@avfrd.org",
    hireDate: "2020-06-15"
  },
  {
    id: "emp-2",
    name: "Jane Smith",
    position: "EMT",
    department: "Emergency Medical",
    email: "jane.smith@avfrd.org",
    hireDate: "2019-03-22"
  },
  {
    id: "emp-3",
    name: "Michael Johnson",
    position: "Captain",
    department: "Fire Operations",
    email: "michael.johnson@avfrd.org",
    hireDate: "2015-11-08"
  },
  {
    id: "emp-4",
    name: "Sarah Williams",
    position: "Paramedic",
    department: "Emergency Medical",
    email: "sarah.williams@avfrd.org",
    hireDate: "2018-09-30"
  },
  {
    id: "emp-5",
    name: "Robert Brown",
    position: "Lieutenant",
    department: "Fire Operations",
    email: "robert.brown@avfrd.org",
    hireDate: "2017-07-12"
  }
];

// Mock Trainings
export const trainings: Training[] = [
  {
    id: "tr-1",
    title: "Basic Firefighter Training",
    type: "Certification",
    category: "Fire Operations",
    description: "Foundational training for all firefighters",
    durationHours: 40,
    requiredFor: ["Fire Operations"]
  },
  {
    id: "tr-2",
    title: "EMT Basic",
    type: "Certification",
    category: "Medical",
    description: "Basic emergency medical technician training",
    durationHours: 120,
    requiredFor: ["Emergency Medical", "Fire Operations"]
  },
  {
    id: "tr-3",
    title: "Hazardous Materials Awareness",
    type: "Compliance",
    category: "Safety",
    description: "Awareness level training for hazardous materials incidents",
    durationHours: 8,
    requiredFor: ["Fire Operations", "Emergency Medical", "Support Services"]
  },
  {
    id: "tr-4",
    title: "Advanced Cardiac Life Support",
    type: "Certification",
    category: "Medical",
    description: "Advanced cardiovascular life support techniques",
    durationHours: 16,
    requiredFor: ["Emergency Medical"]
  },
  {
    id: "tr-5",
    title: "Fire Officer I",
    type: "Certification",
    category: "Leadership",
    description: "Entry-level supervision and management training",
    durationHours: 40,
    requiredFor: ["Fire Operations"]
  },
  {
    id: "tr-6",
    title: "Vehicle Extrication",
    type: "Technical",
    category: "Rescue",
    description: "Techniques for removing victims from vehicle accidents",
    durationHours: 24,
    requiredFor: ["Fire Operations", "Emergency Medical"]
  },
  {
    id: "tr-7",
    title: "CPR/AED",
    type: "Compliance",
    category: "Medical",
    description: "Cardiopulmonary resuscitation and automated external defibrillator training",
    durationHours: 4,
    requiredFor: ["Fire Operations", "Emergency Medical", "Support Services", "Administration"]
  },
  {
    id: "tr-8",
    title: "Pump Operations",
    type: "Technical",
    category: "Fire Operations",
    description: "Operation of fire engine pumping systems",
    durationHours: 24,
    requiredFor: ["Fire Operations"]
  },
  {
    id: "tr-9",
    title: "Incident Command System",
    type: "Compliance",
    category: "Management",
    description: "Standardized approach to command, control, and coordination of emergency response",
    durationHours: 16,
    requiredFor: ["Fire Operations", "Emergency Medical", "Administration"]
  },
  {
    id: "tr-10",
    title: "Aerial Apparatus Operations",
    type: "Technical",
    category: "Fire Operations",
    description: "Operation of ladder trucks and aerial devices",
    durationHours: 24,
    requiredFor: ["Fire Operations"]
  }
];

// Mock Training Completions
export const trainingCompletions: TrainingCompletion[] = [
  {
    id: "comp-1",
    employeeId: "emp-1",
    trainingId: "tr-1",
    completionDate: "2020-07-15",
    status: "completed"
  },
  {
    id: "comp-2",
    employeeId: "emp-1",
    trainingId: "tr-2",
    completionDate: "2020-09-22",
    status: "completed",
    score: 92
  },
  {
    id: "comp-3",
    employeeId: "emp-1",
    trainingId: "tr-3",
    completionDate: "2020-11-05",
    expirationDate: "2023-11-05",
    status: "expired"
  },
  {
    id: "comp-4",
    employeeId: "emp-1",
    trainingId: "tr-7",
    completionDate: "2022-03-18",
    expirationDate: "2024-03-18",
    status: "completed"
  },
  {
    id: "comp-5",
    employeeId: "emp-2",
    trainingId: "tr-2",
    completionDate: "2019-05-10",
    status: "completed",
    score: 88
  },
  {
    id: "comp-6",
    employeeId: "emp-2",
    trainingId: "tr-4",
    completionDate: "2020-01-25",
    expirationDate: "2022-01-25",
    status: "expired"
  },
  {
    id: "comp-7",
    employeeId: "emp-2",
    trainingId: "tr-7",
    completionDate: "2022-04-30",
    expirationDate: "2024-04-30",
    status: "completed"
  },
  {
    id: "comp-8",
    employeeId: "emp-3",
    trainingId: "tr-1",
    completionDate: "2015-12-20",
    status: "completed"
  },
  {
    id: "comp-9",
    employeeId: "emp-3",
    trainingId: "tr-5",
    completionDate: "2017-06-15",
    status: "completed",
    score: 95
  },
  {
    id: "comp-10",
    employeeId: "emp-3",
    trainingId: "tr-9",
    completionDate: "2018-08-22",
    status: "completed"
  },
  {
    id: "comp-11",
    employeeId: "emp-4",
    trainingId: "tr-2",
    completionDate: "2018-11-15",
    status: "completed",
    score: 90
  },
  {
    id: "comp-12",
    employeeId: "emp-4",
    trainingId: "tr-4",
    completionDate: "2019-04-03",
    expirationDate: "2023-04-03",
    status: "completed"
  },
  {
    id: "comp-13",
    employeeId: "emp-5",
    trainingId: "tr-1",
    completionDate: "2017-08-30",
    status: "completed"
  },
  {
    id: "comp-14",
    employeeId: "emp-5",
    trainingId: "tr-5",
    completionDate: "2019-03-17",
    status: "completed",
    score: 89
  },
  {
    id: "comp-15",
    employeeId: "emp-5",
    trainingId: "tr-8",
    completionDate: "2020-06-22",
    status: "completed"
  },
  {
    id: "comp-16",
    employeeId: "emp-5",
    trainingId: "tr-10",
    completionDate: "2021-09-10",
    status: "completed"
  },
  {
    id: "comp-17",
    employeeId: "emp-1",
    trainingId: "tr-8",
    completionDate: "2023-01-12",
    status: "due"
  },
  {
    id: "comp-18",
    employeeId: "emp-2",
    trainingId: "tr-3",
    completionDate: "2021-11-05",
    status: "due"
  }
];

// Mock Department Statistics
export const departmentStats: DepartmentStats[] = [
  {
    department: "Fire Operations",
    completedCount: 28,
    totalRequired: 35,
    complianceRate: 80
  },
  {
    department: "Emergency Medical",
    completedCount: 22,
    totalRequired: 25,
    complianceRate: 88
  },
  {
    department: "Administration",
    completedCount: 10,
    totalRequired: 12,
    complianceRate: 83
  },
  {
    department: "Support Services",
    completedCount: 15,
    totalRequired: 20,
    complianceRate: 75
  }
];

// Mock Training Statistics
export const trainingStatistics: TrainingStatistics = {
  totalTrainings: 10,
  completedTrainings: 75,
  expiredTrainings: 8,
  upcomingTrainings: 12,
  completionRate: 79,
  departmentStats: departmentStats
};

// Mock Positions with requirements
export const positions: Position[] = [
  {
    id: "pos-1",
    title: "Firefighter I",
    description: "Entry-level firefighting position",
    department: "Fire Operations",
    countyRequirements: ["tr-1", "tr-3", "tr-7"], // Basic FF, HazMat, CPR
    avfrdRequirements: ["tr-1", "tr-3", "tr-7", "tr-6"] // + Vehicle Extrication
  },
  {
    id: "pos-2",
    title: "EMT Basic",
    description: "Entry-level emergency medical technician",
    department: "Emergency Medical",
    countyRequirements: ["tr-2", "tr-7"], // EMT Basic, CPR
    avfrdRequirements: ["tr-2", "tr-3", "tr-7"] // + HazMat
  },
  {
    id: "pos-3",
    title: "Engine Driver",
    description: "Qualified to drive and operate fire engines",
    department: "Fire Operations",
    countyRequirements: ["tr-1", "tr-8"], // Basic FF, Pump Operations
    avfrdRequirements: ["tr-1", "tr-3", "tr-7", "tr-8", "tr-9"] // + HazMat, CPR, ICS
  },
  {
    id: "pos-4",
    title: "Lieutenant",
    description: "First-line supervisor for emergency incidents",
    department: "Fire Operations",
    countyRequirements: ["tr-1", "tr-5", "tr-9"], // Basic FF, Fire Officer, ICS
    avfrdRequirements: ["tr-1", "tr-2", "tr-3", "tr-5", "tr-7", "tr-9"] // + EMT, HazMat, CPR
  },
  {
    id: "pos-5",
    title: "Paramedic",
    description: "Advanced emergency medical provider",
    department: "Emergency Medical",
    countyRequirements: ["tr-2", "tr-4", "tr-7"], // EMT, ACLS, CPR
    avfrdRequirements: ["tr-2", "tr-3", "tr-4", "tr-6", "tr-7", "tr-9"] // + HazMat, Vehicle Extrication, ICS
  },
  {
    id: "pos-6",
    title: "Truck Driver",
    description: "Qualified to drive and operate ladder trucks",
    department: "Fire Operations",
    countyRequirements: ["tr-1", "tr-10"], // Basic FF, Aerial Operations
    avfrdRequirements: ["tr-1", "tr-3", "tr-7", "tr-9", "tr-10"] // + HazMat, CPR, ICS
  }
];

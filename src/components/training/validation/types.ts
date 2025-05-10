
export interface ValidationIssue {
  employeeId: string;
  employeeName: string;
  trainingId: string;
  trainingName: string;
  completionDate: string;
  issueType: 'past' | 'future';
}

export interface ValidationStats {
  totalCompletions: number;
  futureCompletions: number;
  pastCompletions: number;
}

export type SortField = 'employeeName' | 'trainingName' | 'completionDate' | 'issueType';
export type SortDirection = 'asc' | 'desc';

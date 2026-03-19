export type CaseStatus = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Cerrado';

export interface PoliceCase {
  id: string;
  caseNumber: string;
  complainantName: string;
  description: string;
  location: string;
  date: string;
  crimeType: string;
  status: CaseStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  username: string;
  role: 'admin';
}
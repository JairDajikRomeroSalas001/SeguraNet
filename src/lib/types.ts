export type CaseStatus = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Cerrado';

export interface PoliceCase {
  id: string;
  caseNumber: string;
  complainantName: string;
  description: string;
  location: string;
  date: string; // Fecha del incidente
  crimeType: string;
  status: CaseStatus;
  tags: string[];
  origin: string; // Origen del documento
  entryDate: string; // Fecha de ingreso al sistema
  entryTime: string; // Hora de ingreso al sistema
  createdAt: string;
  updatedAt: string;
}

export interface User {
  username: string;
  role: 'admin';
}

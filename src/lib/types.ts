export type CaseStatus = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Cerrado';

export interface PoliceCase {
  id: string;
  caseNumber: string;
  // Paso 1: Datos del Expediente
  origin: string;
  entryDate: string;
  entryTime: string;
  // Paso 2: Datos de Víctima y Agresor
  victimName: string;
  victimDni: string;
  aggressorName: string;
  aggressorDni: string;
  // Paso 3: Clasificación del Incidente
  crimeType: string;
  location: string;
  description: string;
  date: string; // Fecha del incidente
  // Metadatos
  status: CaseStatus;
  tags: string[];
  complainantName: string; // Nombre referencial (usualmente la víctima)
  createdAt: string;
  updatedAt: string;
}

export interface User {
  username: string;
  role: 'admin';
}

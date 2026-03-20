export type CaseStatus = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Cerrado';

export interface PersonData {
  name: string;
  dni: string;
  phone: string;
  street: string;
  number: string;
  district: string;
  reference: string;
}

export interface PoliceCase {
  id: string;
  caseNumber: string;
  // Paso 1: Datos del Expediente
  origin: string;
  entryDate: string;
  entryTime: string;
  // Paso 2: Datos de Personas
  victim: PersonData;
  aggressor: PersonData;
  // Paso 3: Clasificación del Incidente
  crimeType: string;
  location: string;
  description: string;
  date: string; // Fecha del incidente
  // Metadatos
  status: CaseStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  username: string;
  role: 'admin';
}

import { PoliceCase, CaseStatus } from './types';

let cases: PoliceCase[] = [
  {
    id: '1',
    caseNumber: 'EXP-2024-001',
    origin: 'Denuncia Directa',
    entryDate: '2024-05-15',
    entryTime: '10:30:00',
    victim: {
      name: 'JUAN PEREZ MENDOZA',
      dni: '12345678',
      phone: '987654321',
      street: 'Av. Sol',
      number: '123',
      district: 'Paucartambo',
      reference: 'Frente al parque'
    },
    aggressor: {
      name: 'DESCONOCIDO',
      dni: '00000000',
      phone: 'N/A',
      street: 'N/A',
      number: 'N/A',
      district: 'N/A',
      reference: 'N/A'
    },
    violenceType: 'Violencia física',
    riskLevel: 'Leve',
    crimeType: 'Agresión física',
    location: 'Plaza de Armas, Paucartambo',
    description: 'Incidente reportado cerca de la plaza central.',
    date: '2024-05-15',
    status: 'Pendiente',
    tags: ['Física', 'Leve'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const getCases = () => cases;

export const addCase = (newCaseData: Omit<PoliceCase, 'id' | 'createdAt' | 'updatedAt'>) => {
  const nextId = (cases.length + 1).toString();
  
  const createdCase: PoliceCase = {
    ...newCaseData,
    id: nextId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  cases = [createdCase, ...cases];
  return createdCase;
};

export const updateCaseStatus = (id: string, status: CaseStatus) => {
  cases = cases.map((c) => 
    c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c
  );
};

import { PoliceCase, CaseStatus } from './types';

let cases: PoliceCase[] = [
  {
    id: '1',
    caseNumber: 'EXP-2024-001',
    origin: 'Denuncia Directa',
    entryDate: '2024-05-15',
    entryTime: '10:30',
    victim: {
      name: 'Juan Pérez',
      dni: '12345678',
      phone: '987654321',
      street: 'Av. Sol',
      number: '123',
      district: 'Paucartambo',
      reference: 'Frente al parque'
    },
    aggressor: {
      name: 'Desconocido',
      dni: '00000000',
      phone: 'N/A',
      street: 'N/A',
      number: 'N/A',
      district: 'N/A',
      reference: 'N/A'
    },
    crimeType: 'Robo Agravado',
    location: 'Plaza de Armas, Paucartambo',
    description: 'Robo a mano armada cerca de la Plaza de Armas.',
    date: '2024-05-15',
    status: 'Pendiente',
    tags: ['Robo', 'Arma blanca'],
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

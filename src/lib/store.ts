import { PoliceCase, CaseStatus } from './types';

let cases: PoliceCase[] = [
  {
    id: '1',
    caseNumber: 'EXP-2024-001',
    origin: 'Denuncia Directa',
    entryDate: '2024-05-15',
    entryTime: '10:30',
    victimName: 'Juan Pérez',
    victimDni: '12345678',
    aggressorName: 'Desconocido',
    aggressorDni: 'N/A',
    crimeType: 'Robo Agravado',
    location: 'Plaza de Armas, Paucartambo',
    description: 'Robo a mano armada cerca de la Plaza de Armas.',
    date: '2024-05-15',
    complainantName: 'Juan Pérez',
    status: 'Pendiente',
    tags: ['Robo', 'Arma blanca'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const getCases = () => cases;

export const addCase = (newCase: Omit<PoliceCase, 'id' | 'createdAt' | 'updatedAt' | 'complainantName'>) => {
  const nextId = (cases.length + 1).toString();
  
  const createdCase: PoliceCase = {
    ...newCase,
    id: nextId,
    complainantName: newCase.victimName,
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

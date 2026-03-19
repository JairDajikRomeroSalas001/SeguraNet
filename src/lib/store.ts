import { PoliceCase, CaseStatus } from './types';

let cases: PoliceCase[] = [
  {
    id: '1',
    caseNumber: 'EXP-2024-001',
    complainantName: 'Juan Pérez',
    description: 'Robo a mano armada cerca de la Plaza de Armas de Paucartambo.',
    location: 'Plaza de Armas, Paucartambo',
    date: '2024-05-15',
    crimeType: 'Robo Agravado',
    status: 'Pendiente',
    tags: ['Robo', 'Arma blanca', 'Plaza de Armas'],
    origin: 'Denuncia Directa',
    entryDate: '2024-05-15',
    entryTime: '10:30',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    caseNumber: 'EXP-2024-002',
    complainantName: 'María Condori',
    description: 'Hurto de pertenencias personales en el Mercado Central.',
    location: 'Mercado Central de Paucartambo',
    date: '2024-05-16',
    crimeType: 'Hurto',
    status: 'En Proceso',
    tags: ['Hurto', 'Mercado'],
    origin: 'Denuncia Directa',
    entryDate: '2024-05-16',
    entryTime: '14:20',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const getCases = () => cases;

export const addCase = (newCase: Omit<PoliceCase, 'id' | 'createdAt' | 'updatedAt' | 'caseNumber'> & { caseNumber?: string }) => {
  const nextId = (cases.length + 1).toString();
  const year = new Date().getFullYear();
  
  // Usar el número de expediente proporcionado o generar uno nuevo
  const finalCaseNumber = newCase.caseNumber || `EXP-${year}-${nextId.padStart(3, '0')}`;
  
  const createdCase: PoliceCase = {
    ...newCase,
    id: nextId,
    caseNumber: finalCaseNumber,
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

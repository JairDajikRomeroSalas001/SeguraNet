import { PoliceCase, CaseStatus } from './types';

let cases: PoliceCase[] = [
  {
    id: '1',
    caseNumber: 'EXP-2024-001',
    assignedOfficer: 'SOT1 PNP RAMOS QUISPE',
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
    incidentDescription: 'Agresión verbal y física leve reportada en la vía pública.',
    incidentDate: '2024-05-15',
    incidentTime: '10:15',
    incidentLocation: 'Plaza de Armas de Paucartambo',
    riskFactors: ['antecedentes_violencia'],
    additionalObservations: 'La víctima solicita medidas de protección.',
    status: 'Pendiente',
    tags: ['Violencia física', 'Leve'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const getCases = (includeDeleted = false) => 
  includeDeleted ? [...cases] : cases.filter(c => !c.isDeleted);

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

export const updateCase = (updatedCase: PoliceCase) => {
  cases = cases.map((c) => 
    c.id === updatedCase.id 
      ? { ...updatedCase, updatedAt: new Date().toISOString() } 
      : c
  );
};

export const updateCaseStatus = (id: string, status: CaseStatus) => {
  cases = cases.map((c) => 
    c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c
  );
};

export const deleteCase = (id: string) => {
  cases = cases.map((c) => 
    c.id === id ? { ...c, isDeleted: true, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : c
  );
};

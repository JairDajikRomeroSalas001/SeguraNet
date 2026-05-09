export type CaseStatus = 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Cerrado' | 'Archivado';
export type RiskLevel = 'Leve' | 'Moderado' | 'Severo' | 'Muy Severo';

export type Role = 'superadmin' | 'oficial_operativo' | 'auditor' | 'readonly';

export interface PersonData {
  name: string;
  dni: string;
  phone: string;
  street: string;
  number: string;
  district: string;
  annex: string;
  community: string;
  reference: string;
}

export interface PoliceCase {
  id: string;
  caseNumber: string;
  assignedOfficer: string;
  createdByUid: string;
  createdByUsername: string;
  origin: string;
  entryDate: string;
  entryTime: string;
  victim: PersonData;
  aggressor: PersonData;
  violenceType: string[];
  riskLevel: RiskLevel;
  incidentDescription: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  riskFactors: string[];
  additionalObservations: string;
  status: CaseStatus;
  tags: string[];
  isDeleted: boolean;
  deletedAt: string | null;
  integrityHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  uid: string;
  username: string;
  fullName: string;
  dni: string;
  role: Role;
  isActive: boolean;
}

export interface CaseDocument {
  id: string;
  caseId: string;
  uploadedByUid: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  documentType: string;
  description: string;
  status: 'pending' | 'ready' | 'failed';
  storagePath: string;
  integrityHash: string;
  uploadedAt: string;
  isDeleted: boolean;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'SESSION_EXPIRED'
  | 'VIEW_EXPEDIENT'
  | 'CREATE_EXPEDIENT'
  | 'UPDATE_EXPEDIENT'
  | 'DELETE_EXPEDIENT'
  | 'EXPORT_REPORT'
  | 'SECURITY_VIOLATION'
  | 'CREATE_USER'
  | 'DELETE_USER'
  | 'UPDATE_CREDENTIALS'
  | 'UPLOAD_DOCUMENT'
  | 'VIEW_DOCUMENT'
  | 'DELETE_DOCUMENT'
  | 'SYSTEM_BACKUP'
  | 'EXTERNAL_API_CALL';

export interface AuditEntry {
  id: string;
  timestamp: string;
  officerUid: string;
  officerUsername: string;
  action: AuditAction;
  resourceId: string | null;
  details: string;
  userAgent: string;
  ipAddress: string;
  hmacSignature: string;
}

export interface SessionUser {
  uid: string;
  username: string;
  fullName: string;
  role: Role;
}

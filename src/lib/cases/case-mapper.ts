import 'server-only';
import type { Case as DbCase, CasePerson as DbCasePerson } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { encryptField, decryptField } from '@/lib/security/field-encryption';
import type { PoliceCase, PersonData, RiskLevel, CaseStatus } from '@/lib/types';

// Helpers de cifrado PII
const ENC = (s: string) => encryptField(s);
const DEC = (s: string) => decryptField(s);

// ─── Persona → DB ────────────────────────────────────────────────────────────

/**
 * Cifra un PersonData para insertar como registro CasePerson.
 * Cada campo PII se cifra individualmente con AES-256-GCM.
 */
export function personToDbInput(
  p: PersonData,
  caseId: string,
  role: 'victim' | 'aggressor',
  sortOrder: number,
) {
  return {
    id: uuid(),
    caseId,
    role,
    sortOrder,
    name: ENC(p.name),
    dni: ENC(p.dni),
    phone: ENC(p.phone),
    street: ENC(p.street),
    number: ENC(p.number),
    district: p.district,
    annex: p.annex ?? '',
    community: p.community ?? '',
    reference: ENC(p.reference),
  };
}

/**
 * Descifra un registro CasePerson → PersonData.
 */
export function dbPersonToData(row: DbCasePerson): PersonData {
  return {
    name: DEC(row.name),
    dni: DEC(row.dni),
    phone: DEC(row.phone),
    street: DEC(row.street),
    number: DEC(row.number),
    district: row.district,
    annex: row.annex,
    community: row.community,
    reference: DEC(row.reference),
  };
}

// ─── Case → DB ───────────────────────────────────────────────────────────────

/**
 * Convierte un PoliceCase a la estructura plana para Prisma (sin personas).
 * Las personas se insertan por separado con personToDbInput().
 */
export function caseToDbInput(c: PoliceCase) {
  return {
    id: c.id,
    caseNumber: c.caseNumber,
    assignedOfficer: c.assignedOfficer,
    origin: c.origin,
    entryDate: c.entryDate,
    entryTime: c.entryTime,

    violenceType: JSON.stringify(c.violenceType ?? []),
    riskLevel: c.riskLevel,
    incidentDescription: ENC(c.incidentDescription),
    incidentDate: c.incidentDate,
    incidentTime: c.incidentTime,
    incidentLocation: ENC(c.incidentLocation),
    riskFactors: JSON.stringify(c.riskFactors ?? []),
    additionalObservations: ENC(c.additionalObservations ?? ''),
    status: c.status,
    tags: JSON.stringify(c.tags ?? []),

    isDeleted: c.isDeleted,
    deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
    integrityHash: c.integrityHash,

    createdByUid: c.createdByUid,
    createdByUsername: c.createdByUsername,

    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),

    deadlineAt: c.deadlineAt ? new Date(c.deadlineAt) : null,
  };
}

// ─── DB → Case ───────────────────────────────────────────────────────────────

type DbCaseWithPersons = DbCase & { persons: DbCasePerson[] };

/**
 * Convierte un registro de BD (con personas incluidas) a PoliceCase.
 * Las personas se separan por rol y se ordenan por sortOrder.
 */
export function dbToCase(row: DbCaseWithPersons): PoliceCase {
  const persons = row.persons ?? [];

  const victims = persons
    .filter(p => p.role === 'victim')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(dbPersonToData);

  const aggressors = persons
    .filter(p => p.role === 'aggressor')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(dbPersonToData);

  return {
    id: row.id,
    caseNumber: row.caseNumber,
    assignedOfficer: row.assignedOfficer,
    origin: row.origin,
    entryDate: row.entryDate,
    entryTime: row.entryTime,

    victims,
    aggressors,

    violenceType: safeJsonOrString(row.violenceType),
    riskLevel: row.riskLevel as RiskLevel,
    incidentDescription: DEC(row.incidentDescription),
    incidentDate: row.incidentDate,
    incidentTime: row.incidentTime,
    incidentLocation: DEC(row.incidentLocation),
    riskFactors: safeJson(row.riskFactors),
    additionalObservations: DEC(row.additionalObservations),
    status: row.status as CaseStatus,
    tags: safeJson(row.tags),

    isDeleted: row.isDeleted,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    integrityHash: row.integrityHash,

    createdByUid: row.createdByUid,
    createdByUsername: row.createdByUsername,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deadlineAt: row.deadlineAt?.toISOString() ?? null,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeJson(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch { return []; }
}

function safeJsonOrString(s: string): string[] {
  try {
    const v = JSON.parse(s);
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string' && v) return [v];
    return [];
  } catch {
    return s ? [s] : [];
  }
}

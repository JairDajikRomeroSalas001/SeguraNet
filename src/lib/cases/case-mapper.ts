import 'server-only';
import type { Case as DbCase } from '@prisma/client';
import { encryptField, decryptField } from '@/lib/security/field-encryption';
import type { PoliceCase, RiskLevel, CaseStatus } from '@/lib/types';

// Campos PII cifrados en la BD (también listados aquí para referencia visual).
const ENC = (s: string) => encryptField(s);
const DEC = (s: string) => decryptField(s);

export function caseToDbInput(c: PoliceCase) {
  return {
    id: c.id,
    caseNumber: c.caseNumber,
    assignedOfficer: c.assignedOfficer,
    origin: c.origin,
    entryDate: c.entryDate,
    entryTime: c.entryTime,

    victimName: ENC(c.victim.name),
    victimDni: ENC(c.victim.dni),
    victimPhone: ENC(c.victim.phone),
    victimStreet: ENC(c.victim.street),
    victimNumber: ENC(c.victim.number),
    victimDistrict: c.victim.district,
    victimAnnex: c.victim.annex ?? '',
    victimCommunity: c.victim.community ?? '',
    victimReference: ENC(c.victim.reference),

    aggressorName: ENC(c.aggressor.name),
    aggressorDni: ENC(c.aggressor.dni),
    aggressorPhone: ENC(c.aggressor.phone),
    aggressorStreet: ENC(c.aggressor.street),
    aggressorNumber: ENC(c.aggressor.number),
    aggressorDistrict: c.aggressor.district,
    aggressorAnnex: c.aggressor.annex ?? '',
    aggressorCommunity: c.aggressor.community ?? '',
    aggressorReference: ENC(c.aggressor.reference),

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

export function dbToCase(row: DbCase): PoliceCase {
  return {
    id: row.id,
    caseNumber: row.caseNumber,
    assignedOfficer: row.assignedOfficer,
    origin: row.origin,
    entryDate: row.entryDate,
    entryTime: row.entryTime,

    victim: {
      name: DEC(row.victimName),
      dni: DEC(row.victimDni),
      phone: DEC(row.victimPhone),
      street: DEC(row.victimStreet),
      number: DEC(row.victimNumber),
      district: row.victimDistrict,
      annex: row.victimAnnex,
      community: row.victimCommunity,
      reference: DEC(row.victimReference),
    },
    aggressor: {
      name: DEC(row.aggressorName),
      dni: DEC(row.aggressorDni),
      phone: DEC(row.aggressorPhone),
      street: DEC(row.aggressorStreet),
      number: DEC(row.aggressorNumber),
      district: row.aggressorDistrict,
      annex: row.aggressorAnnex,
      community: row.aggressorCommunity,
      reference: DEC(row.aggressorReference),
    },

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

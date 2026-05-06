import 'server-only';
import { v4 as uuid } from 'uuid';
import { prisma } from './prisma';
import { signHmac, verifyHmac } from './security/hmac';
import type { AuditAction, AuditEntry } from './types';

interface LogInput {
  officerUid: string;
  officerUsername: string;
  action: AuditAction;
  resourceId?: string | null;
  details?: string;
  userAgent?: string;
  ipAddress?: string;
}

export async function logAuditEvent(input: LogInput): Promise<void> {
  const id = uuid();
  const timestamp = new Date();
  const base = {
    id,
    timestamp: timestamp.toISOString(),
    officerUid: input.officerUid,
    officerUsername: input.officerUsername,
    action: input.action,
    resourceId: input.resourceId ?? null,
    details: input.details ?? '',
    userAgent: input.userAgent ?? '',
    ipAddress: input.ipAddress ?? '',
  };
  const hmacSignature = signHmac(base);

  try {
    await prisma.auditLog.create({
      data: {
        id,
        timestamp,
        officerUid: base.officerUid,
        officerUsername: base.officerUsername,
        action: base.action,
        resourceId: base.resourceId,
        details: base.details,
        userAgent: base.userAgent,
        ipAddress: base.ipAddress,
        hmacSignature,
      },
    });
  } catch (err) {
    console.error('[audit] no se pudo persistir entrada', err);
  }
}

export function verifyAuditEntry(entry: AuditEntry): boolean {
  const { hmacSignature, ...rest } = entry;
  return verifyHmac(rest, hmacSignature);
}

export interface ListOptions {
  limit?: number;
  officerUid?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
}

export async function listAuditEntries(options: ListOptions = {}): Promise<AuditEntry[]> {
  const where: Record<string, unknown> = {};
  if (options.officerUid) where.officerUid = options.officerUid;
  if (options.action) where.action = options.action;
  if (options.startDate || options.endDate) {
    where.timestamp = {
      ...(options.startDate ? { gte: options.startDate } : {}),
      ...(options.endDate ? { lte: options.endDate } : {}),
    };
  }
  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: options.limit ?? 200,
  });
  return rows.map(r => ({
    id: r.id,
    timestamp: r.timestamp.toISOString(),
    officerUid: r.officerUid,
    officerUsername: r.officerUsername,
    action: r.action as AuditAction,
    resourceId: r.resourceId,
    details: r.details,
    userAgent: r.userAgent,
    ipAddress: r.ipAddress,
    hmacSignature: r.hmacSignature,
  }));
}

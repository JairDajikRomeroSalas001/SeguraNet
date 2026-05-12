import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/prisma';
import { requireSession, clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { requireRole } from '@/lib/middleware/rbac';
import { sha256Hex } from '@/lib/security/hmac';
import { logAuditEvent } from '@/lib/audit-logger';
import { caseToDbInput, dbToCase } from '@/lib/cases/case-mapper';
import type { PoliceCase } from '@/lib/types';

export const runtime = 'nodejs';

const personSchema = z.object({
  name: z.string().min(1).max(200),
  dni: z.string().regex(/^\d{8}$/),
  phone: z.string().regex(/^\d{9}$/),
  street: z.string().min(1).max(200),
  number: z.string().min(1).max(20),
  district: z.string().min(1).max(100),
  annex: z.string().max(200).optional().default(''),
  community: z.string().max(200).optional().default(''),
  reference: z.string().max(500).optional().default(''),
});

const createSchema = z.object({
  caseNumber: z.string().min(1).max(50),
  assignedOfficer: z.string().min(1).max(200),
  origin: z.string().min(1).max(100),
  entryDate: z.string().min(1),
  entryTime: z.string().min(1),
  victim: personSchema,
  aggressor: personSchema,
  violenceType: z.array(z.string()).min(1, 'Seleccione al menos uno'),
  riskLevel: z.enum(['Leve', 'Moderado', 'Severo', 'Muy Severo']),
  incidentDescription: z.string().min(1).max(5000),
  incidentDate: z.string().min(1),
  incidentTime: z.string().min(1),
  incidentLocation: z.string().min(1).max(500),
  riskFactors: z.array(z.string()).default([]),
  additionalObservations: z.string().max(5000).optional().default(''),
  tags: z.array(z.string()).optional().default([]),
});

export async function GET(request: NextRequest) {
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? undefined;
  const riskLevel = url.searchParams.get('riskLevel') ?? undefined;
  const q = url.searchParams.get('q')?.trim() ?? '';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 100)));

  const onlyMine = url.searchParams.get('onlyMine') === '1';
  const where: Record<string, unknown> = { isDeleted: false };
  if (onlyMine) {
    where.createdByUid = session.uid;
  }
  if (status) where.status = status;
  if (riskLevel) where.riskLevel = riskLevel;
  if (q) {
    where.OR = [
      { caseNumber: { contains: q } },
      { assignedOfficer: { contains: q } },
      { violenceType: { contains: q } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.case.count({ where }),
    prisma.case.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const cases = rows.map(dbToCase);
  return NextResponse.json({ cases, page, limit, total });
}

export async function POST(request: NextRequest) {
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const denied = requireRole(session, ['superadmin', 'oficial_operativo']);
  if (denied) return denied;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: 'Datos inválidos', detail: String(err) }, { status: 400 });
  }

  const dup = await prisma.case.findUnique({ where: { caseNumber: body.caseNumber } });
  if (dup && !dup.isDeleted) {
    return NextResponse.json({ error: 'Número de expediente duplicado' }, { status: 409 });
  }

  const id = uuid();
  const now = new Date().toISOString();

  const plain: PoliceCase = {
    id,
    caseNumber: body.caseNumber,
    assignedOfficer: body.assignedOfficer,
    origin: body.origin,
    entryDate: body.entryDate,
    entryTime: body.entryTime,
    victim: body.victim,
    aggressor: body.aggressor,
    violenceType: body.violenceType,
    riskLevel: body.riskLevel,
    incidentDescription: body.incidentDescription,
    incidentDate: body.incidentDate,
    incidentTime: body.incidentTime,
    incidentLocation: body.incidentLocation,
    riskFactors: body.riskFactors,
    additionalObservations: body.additionalObservations ?? '',
    status: 'Pendiente',
    tags: body.tags?.length ? body.tags : [...(body.violenceType ?? []), body.riskLevel],
    isDeleted: false,
    deletedAt: null,
    integrityHash: '',
    createdByUid: session.uid,
    createdByUsername: session.username,
    createdAt: now,
    updatedAt: now,
  };
  plain.integrityHash = sha256Hex(JSON.stringify(plain));

  await prisma.case.create({ data: caseToDbInput(plain) });

  await logAuditEvent({
    officerUid: session.uid,
    officerUsername: session.username,
    action: 'CREATE_EXPEDIENT',
    resourceId: id,
    details: `Expediente ${body.caseNumber} creado`,
    userAgent: userAgent(request),
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ case: plain }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { canManageCase, canViewCase } from '@/lib/middleware/rbac';
import { verifyPassword } from '@/lib/security/password';
import { sha256Hex } from '@/lib/security/hmac';
import { logAuditEvent } from '@/lib/audit-logger';
import { caseToDbInput, dbToCase } from '@/lib/cases/case-mapper';
import type { PoliceCase } from '@/lib/types';

export const runtime = 'nodejs';

const updateSchema = z.object({
  passwordConfirm: z.string().min(1),
  data: z.record(z.string(), z.any()),
});

const deleteSchema = z.object({ passwordConfirm: z.string().min(1) });

async function verifyCurrentUserPassword(uid: string, password: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: uid } });
  return !!u && verifyPassword(password, u.passwordHash);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const row = await prisma.case.findUnique({ where: { id } });
  if (!row || row.isDeleted) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
  }
  if (!canViewCase(session, row.createdByUid)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const plain = dbToCase(row);

  await logAuditEvent({
    officerUid: session.uid,
    officerUsername: session.username,
    action: 'VIEW_EXPEDIENT',
    resourceId: id,
    details: `Consulta de ${plain.caseNumber}`,
    userAgent: userAgent(request),
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ case: plain });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  let body: z.infer<typeof updateSchema>;
  try {
    body = updateSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const ok = await verifyCurrentUserPassword(session.uid, body.passwordConfirm);
  if (!ok) {
    await logAuditEvent({
      officerUid: session.uid,
      officerUsername: session.username,
      action: 'SECURITY_VIOLATION',
      resourceId: id,
      details: 'Confirmación de contraseña fallida en edición',
      userAgent: userAgent(request),
      ipAddress: clientIp(request),
    });
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const row = await prisma.case.findUnique({ where: { id } });
  if (!row || row.isDeleted) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
  }
  if (!canManageCase(session, row.createdByUid)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const current = dbToCase(row);
  const merged: PoliceCase = {
    ...current,
    ...(body.data as Partial<PoliceCase>),
    id: current.id,
    createdByUid: current.createdByUid,
    createdByUsername: current.createdByUsername,
    isDeleted: current.isDeleted,
    deletedAt: current.deletedAt,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
    integrityHash: '',
  };
  merged.integrityHash = sha256Hex(JSON.stringify(merged));

  await prisma.case.update({ where: { id }, data: caseToDbInput(merged) });

  await logAuditEvent({
    officerUid: session.uid,
    officerUsername: session.username,
    action: 'UPDATE_EXPEDIENT',
    resourceId: id,
    details: `Edición de ${current.caseNumber}`,
    userAgent: userAgent(request),
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ case: merged });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  let body: z.infer<typeof deleteSchema>;
  try {
    body = deleteSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const ok = await verifyCurrentUserPassword(session.uid, body.passwordConfirm);
  if (!ok) return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });

  const row = await prisma.case.findUnique({ where: { id } });
  if (!row || row.isDeleted) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
  }
  if (!canManageCase(session, row.createdByUid)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  await prisma.case.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  await logAuditEvent({
    officerUid: session.uid,
    officerUsername: session.username,
    action: 'DELETE_EXPEDIENT',
    resourceId: id,
    details: `Eliminación lógica de ${row.caseNumber}`,
    userAgent: userAgent(request),
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ ok: true });
}

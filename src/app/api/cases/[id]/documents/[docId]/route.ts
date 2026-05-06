import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { canManageCase } from '@/lib/middleware/rbac';
import { logAuditEvent } from '@/lib/audit-logger';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id: caseId, docId } = await params;
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if (!c) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (!canManageCase(session, c.createdByUid)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc || doc.caseId !== caseId) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  }

  await prisma.document.update({
    where: { id: docId },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  await logAuditEvent({
    officerUid: session.uid,
    officerUsername: session.username,
    action: 'DELETE_DOCUMENT',
    resourceId: docId,
    details: `Soft-delete de ${doc.filename}`,
    userAgent: userAgent(request),
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ ok: true });
}

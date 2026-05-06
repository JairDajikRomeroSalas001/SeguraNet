import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { canViewCase } from '@/lib/middleware/rbac';
import { fileExists, readFileBytes } from '@/lib/storage/local-storage';
import { logAuditEvent } from '@/lib/audit-logger';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id: caseId, docId } = await params;
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if (!c) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (!canViewCase(session, c.createdByUid)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc || doc.caseId !== caseId) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  }
  if (doc.isDeleted || doc.status !== 'ready') {
    return NextResponse.json({ error: 'Documento no disponible' }, { status: 410 });
  }
  if (!(await fileExists(doc.storagePath))) {
    return NextResponse.json({ error: 'Archivo físico ausente' }, { status: 410 });
  }

  await logAuditEvent({
    officerUid: session.uid,
    officerUsername: session.username,
    action: 'VIEW_DOCUMENT',
    resourceId: docId,
    details: `Descarga de ${doc.filename} (${c.caseNumber})`,
    userAgent: userAgent(request),
    ipAddress: clientIp(request),
  });

  const data = await readFileBytes(doc.storagePath);
  return new NextResponse(data, {
    status: 200,
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Length': String(doc.sizeBytes),
      'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.filename)}"`,
      'Cache-Control': 'private, no-store',
      'X-Integrity-Hash': doc.integrityHash,
    },
  });
}

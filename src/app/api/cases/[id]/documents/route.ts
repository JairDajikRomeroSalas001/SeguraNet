import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/middleware/auth-helper';
import { canViewCase } from '@/lib/middleware/rbac';
import type { CaseDocument } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const c = await prisma.case.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (!canViewCase(session, c.createdByUid)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const docs = await prisma.document.findMany({
    where: { caseId: id, isDeleted: false, status: 'ready' },
    orderBy: { uploadedAt: 'desc' },
  });

  const documents: CaseDocument[] = docs.map(d => ({
    id: d.id,
    caseId: d.caseId,
    uploadedByUid: d.uploadedByUid,
    filename: d.filename,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    documentType: d.documentType,
    description: d.description,
    status: d.status as 'pending' | 'ready' | 'failed',
    storagePath: d.storagePath,
    integrityHash: d.integrityHash,
    uploadedAt: d.uploadedAt.toISOString(),
    isDeleted: d.isDeleted,
  }));

  return NextResponse.json({ documents });
}

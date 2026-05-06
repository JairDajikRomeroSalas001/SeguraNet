import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { canManageCase } from '@/lib/middleware/rbac';
import { saveFile } from '@/lib/storage/local-storage';
import { validateFileUpload } from '@/lib/security/file-validator';
import { logAuditEvent } from '@/lib/audit-logger';

export const runtime = 'nodejs';

export const config = { api: { bodyParser: false } };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id: caseId, docId } = await params;
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const caseRow = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRow) return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 });
  if (!canManageCase(session, caseRow.createdByUid)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const docRow = await prisma.document.findUnique({ where: { id: docId } });
  if (!docRow || docRow.caseId !== caseId) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  }
  if (docRow.status === 'ready') {
    return NextResponse.json({ error: 'Documento ya subido' }, { status: 409 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Cuerpo multipart inválido' }, { status: 400 });
  }
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Campo "file" faltante' }, { status: 400 });
  }

  const validation = validateFileUpload(file.name, file.type || docRow.mimeType, file.size);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let saved;
  try {
    saved = await saveFile(docRow.storagePath, buffer);
  } catch (err) {
    await prisma.document.update({ where: { id: docId }, data: { status: 'failed' } });
    return NextResponse.json({ error: 'Error al guardar archivo', detail: String(err) }, { status: 500 });
  }

  await prisma.document.update({
    where: { id: docId },
    data: {
      status: 'ready',
      integrityHash: saved.sha256,
      sizeBytes: saved.sizeBytes,
    },
  });

  await logAuditEvent({
    officerUid: session.uid,
    officerUsername: session.username,
    action: 'UPLOAD_DOCUMENT',
    resourceId: docId,
    details: `Subida de ${docRow.filename} → ${caseRow.caseNumber} (sha256:${saved.sha256.slice(0, 12)})`,
    userAgent: userAgent(request),
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ ok: true, integrityHash: saved.sha256, sizeBytes: saved.sizeBytes });
}

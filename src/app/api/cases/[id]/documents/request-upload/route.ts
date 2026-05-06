import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/middleware/auth-helper';
import { canManageCase } from '@/lib/middleware/rbac';
import { validateFileUpload } from '@/lib/security/file-validator';
import { buildCaseDocumentPath } from '@/lib/storage/local-storage';

export const runtime = 'nodejs';

const schema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
  documentType: z.string().min(1).max(50),
  description: z.string().max(500).optional().default(''),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await params;
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const validation = validateFileUpload(body.filename, body.mimeType, body.sizeBytes);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if (!c) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
  if (!canManageCase(session, c.createdByUid)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const docId = uuid();
  const sanitized = validation.sanitizedFilename!;
  const storagePath = buildCaseDocumentPath(caseId, docId, sanitized);

  await prisma.document.create({
    data: {
      id: docId,
      caseId,
      uploadedByUid: session.uid,
      filename: sanitized,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      documentType: body.documentType,
      description: body.description ?? '',
      status: 'pending',
      storagePath,
      integrityHash: '',
    },
  });

  return NextResponse.json({
    docId,
    uploadEndpoint: `/api/cases/${caseId}/documents/${docId}/upload`,
    storagePath,
    expectedMimeType: body.mimeType,
    expectedSizeBytes: body.sizeBytes,
  });
}

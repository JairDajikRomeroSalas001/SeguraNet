import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { canManageCase } from '@/lib/middleware/rbac';
import { verifyPassword } from '@/lib/security/password';
import { logAuditEvent } from '@/lib/audit-logger';

export const runtime = 'nodejs';

const schema = z.object({
  status: z.enum(['Pendiente', 'En Proceso', 'Resuelto', 'Cerrado', 'Archivado']),
  passwordConfirm: z.string().min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || !(await verifyPassword(body.passwordConfirm, user.passwordHash))) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const row = await prisma.case.findUnique({ where: { id } });
  if (!row || row.isDeleted) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
  if (!canManageCase(session, row.createdByUid)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  await prisma.case.update({ where: { id }, data: { status: body.status } });

  await logAuditEvent({
    officerUid: session.uid,
    officerUsername: session.username,
    action: 'UPDATE_EXPEDIENT',
    resourceId: id,
    details: `Estado → ${body.status} (${row.caseNumber})`,
    userAgent: userAgent(request),
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ ok: true });
}

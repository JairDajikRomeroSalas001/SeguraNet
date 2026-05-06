import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { requireRole } from '@/lib/middleware/rbac';
import { logAuditEvent } from '@/lib/audit-logger';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params;
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;
  const denied = requireRole(session, ['superadmin']);
  if (denied) return denied;

  if (uid === session.uid) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: uid } });
  if (!target) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  if (target.role === 'superadmin') {
    const remaining = await prisma.user.count({ where: { role: 'superadmin', isActive: true } });
    if (remaining <= 1) {
      return NextResponse.json(
        { error: 'No se puede eliminar al último superadmin activo' },
        { status: 400 },
      );
    }
  }

  await prisma.user.update({ where: { id: uid }, data: { isActive: false } });

  await logAuditEvent({
    officerUid: session.uid,
    officerUsername: session.username,
    action: 'DELETE_USER',
    resourceId: uid,
    details: `Baja lógica de usuario ${target.username}`,
    userAgent: userAgent(request),
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/middleware/auth-helper';
import { requireRole } from '@/lib/middleware/rbac';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const denied = requireRole(guard.session, ['superadmin']);
  if (denied) return denied;

  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  } catch {
    return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/middleware/auth-helper';
import { requireRole } from '@/lib/middleware/rbac';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const denied = requireRole(session, ['superadmin']);
  if (denied) return denied;

  const rows = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const notifications = rows.map(n => ({
    id: n.id,
    caseId: n.caseId,
    caseNumber: n.caseNumber,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  return NextResponse.json({ notifications });
}

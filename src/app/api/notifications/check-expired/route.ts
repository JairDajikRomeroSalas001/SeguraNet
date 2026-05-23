import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/middleware/auth-helper';
import { requireRole } from '@/lib/middleware/rbac';

export const runtime = 'nodejs';

const TERMINAL = ['Cerrado', 'Archivado'];

export async function POST(request: NextRequest) {
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const denied = requireRole(session, ['superadmin']);
  if (denied) return denied;

  const now = new Date();

  const expiredCases = await prisma.case.findMany({
    where: {
      isDeleted: false,
      status: { notIn: TERMINAL },
      deadlineAt: { lt: now, not: null },
    },
    select: {
      id: true,
      caseNumber: true,
      assignedOfficer: true,
      notifications: { select: { id: true } },
    },
  });

  let created = 0;
  for (const c of expiredCases) {
    if (c.notifications.length > 0) continue;
    try {
      await prisma.notification.create({
        data: {
          id: uuid(),
          caseId: c.id,
          caseNumber: c.caseNumber,
          message: `El comisario ${c.assignedOfficer} no culminó con el expediente ${c.caseNumber}`,
        },
      });
      created++;
    } catch {
      // unique constraint race — already notified
    }
  }

  return NextResponse.json({ checked: expiredCases.length, created });
}

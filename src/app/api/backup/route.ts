import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { requireRole } from '@/lib/middleware/rbac';
import { verifyPassword } from '@/lib/security/password';
import { signHmac } from '@/lib/security/hmac';
import { dbToCase } from '@/lib/cases/case-mapper';
import { listAuditEntries, logAuditEvent } from '@/lib/audit-logger';

export const runtime = 'nodejs';

const schema = z.object({ passwordConfirm: z.string().min(1) });

export async function POST(request: NextRequest) {
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;
  const denied = requireRole(session, ['superadmin', 'auditor']);
  if (denied) return denied;

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

  const [caseRows, audit] = await Promise.all([
    prisma.case.findMany({ orderBy: { createdAt: 'desc' } }),
    listAuditEntries({ limit: 10000 }),
  ]);
  const cases = caseRows.map(dbToCase);

  const payload = {
    version: '3.0',
    generatedAt: new Date().toISOString(),
    generatedBy: { uid: session.uid, username: session.username, fullName: session.fullName },
    counts: { cases: cases.length, audit: audit.length },
    data: { cases, audit },
  };
  const hmac = signHmac(payload);

  await logAuditEvent({
    officerUid: session.uid,
    officerUsername: session.username,
    action: 'SYSTEM_BACKUP',
    details: `Backup: ${cases.length} casos, ${audit.length} audit`,
    userAgent: userAgent(request),
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ ...payload, hmac });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

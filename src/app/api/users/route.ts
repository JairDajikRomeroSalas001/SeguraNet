import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/prisma';
import { requireSession, clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { requireRole } from '@/lib/middleware/rbac';
import { hashPassword } from '@/lib/security/password';
import { decryptField, encryptField } from '@/lib/security/field-encryption';
import { logAuditEvent } from '@/lib/audit-logger';
import type { Role } from '@/lib/types';

export const runtime = 'nodejs';

const createSchema = z.object({
  username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(8).max(256),
  fullName: z.string().min(3).max(200),
  dni: z.string().regex(/^\d{8}$/),
  role: z.enum(['superadmin', 'oficial_operativo', 'auditor', 'readonly']).default('oficial_operativo'),
});

export async function GET(request: NextRequest) {
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;
  const denied = requireRole(session, ['superadmin', 'auditor']);
  if (denied) return denied;

  const rows = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const users = rows.map(u => ({
    uid: u.id,
    username: u.username,
    fullName: decryptField(u.fullName),
    dni: decryptField(u.dni),
    role: u.role as Role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  }));

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;
  const denied = requireRole(session, ['superadmin']);
  if (denied) return denied;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: 'Datos inválidos', detail: String(err) }, { status: 400 });
  }

  const dup = await prisma.user.findUnique({ where: { username: body.username } });
  if (dup) {
    return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 409 });
  }

  const id = uuid();
  const passwordHash = await hashPassword(body.password);

  await prisma.user.create({
    data: {
      id,
      username: body.username,
      passwordHash,
      fullName: encryptField(body.fullName),
      dni: encryptField(body.dni),
      role: body.role,
      isActive: true,
    },
  });

  await logAuditEvent({
    officerUid: session.uid,
    officerUsername: session.username,
    action: 'CREATE_USER',
    resourceId: id,
    details: `Alta de oficial: ${body.fullName} (${body.username}, rol ${body.role})`,
    userAgent: userAgent(request),
    ipAddress: clientIp(request),
  });

  return NextResponse.json(
    { user: { uid: id, username: body.username, fullName: body.fullName, dni: body.dni, role: body.role } },
    { status: 201 },
  );
}

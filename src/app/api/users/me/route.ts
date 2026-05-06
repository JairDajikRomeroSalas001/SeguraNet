import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { hashPassword, verifyPassword } from '@/lib/security/password';
import { encryptField } from '@/lib/security/field-encryption';
import { logAuditEvent } from '@/lib/audit-logger';

export const runtime = 'nodejs';

const schema = z.object({
  currentPassword: z.string().min(1),
  username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  fullName: z.string().min(3).max(200).optional(),
  dni: z.string().regex(/^\d{8}$/).optional(),
  newPassword: z.string().min(8).max(256).optional(),
});

export async function PUT(request: NextRequest) {
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: 'Datos inválidos', detail: String(err) }, { status: 400 });
  }

  const current = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!current) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (!(await verifyPassword(body.currentPassword, current.passwordHash))) {
    return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 });
  }

  if (body.username && body.username !== current.username) {
    const dup = await prisma.user.findUnique({ where: { username: body.username } });
    if (dup) return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 409 });
  }

  const updates: Record<string, unknown> = {};
  if (body.username) updates.username = body.username;
  if (body.newPassword) updates.passwordHash = await hashPassword(body.newPassword);
  if (body.fullName) updates.fullName = encryptField(body.fullName);
  if (body.dni) updates.dni = encryptField(body.dni);

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({ where: { id: session.uid }, data: updates });
  }

  await logAuditEvent({
    officerUid: session.uid,
    officerUsername: session.username,
    action: 'UPDATE_CREDENTIALS',
    details: `Perfil actualizado (${Object.keys(updates).join(', ') || 'sin cambios'})`,
    userAgent: userAgent(request),
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ ok: true });
}

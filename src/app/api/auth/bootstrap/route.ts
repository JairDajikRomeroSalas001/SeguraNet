import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/security/password';
import { encryptField } from '@/lib/security/field-encryption';
import { logAuditEvent } from '@/lib/audit-logger';

export const runtime = 'nodejs';

export async function POST() {
  const count = await prisma.user.count();
  if (count > 0) {
    return NextResponse.json({ error: 'Bootstrap deshabilitado: ya existen usuarios' }, { status: 409 });
  }

  const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const fullName = process.env.BOOTSTRAP_ADMIN_FULLNAME;
  const dni = process.env.BOOTSTRAP_ADMIN_DNI;
  if (!username || !password || !fullName || !dni) {
    return NextResponse.json(
      { error: 'Variables BOOTSTRAP_ADMIN_* no configuradas' },
      { status: 500 },
    );
  }

  const id = uuid();
  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      id,
      username,
      passwordHash,
      fullName: encryptField(fullName),
      dni: encryptField(dni),
      role: 'superadmin',
      isActive: true,
    },
  });

  await logAuditEvent({
    officerUid: id,
    officerUsername: username,
    action: 'CREATE_USER',
    details: `Bootstrap: usuario raíz '${username}' creado`,
  });

  return NextResponse.json({ ok: true, uid: id, username });
}

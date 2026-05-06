import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/security/password';
import { signSession } from '@/lib/security/jwt';
import { logAuditEvent } from '@/lib/audit-logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { decryptField } from '@/lib/security/field-encryption';
import type { Role } from '@/lib/types';

export const runtime = 'nodejs';

const schema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

const COOKIE = process.env.SESSION_COOKIE_NAME ?? 'seguranet_session';
const MAX_AGE = Number(process.env.SESSION_COOKIE_MAX_AGE ?? 3600);

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const ua = userAgent(request);

  const ipLimit = await checkRateLimit(RATE_LIMITS.login(ip));
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intente más tarde.' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } },
    );
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username: body.username } });
  if (!user || !user.isActive) {
    await logAuditEvent({
      officerUid: 'unknown',
      officerUsername: body.username,
      action: 'LOGIN_FAILED',
      details: 'Usuario no encontrado o inactivo',
      userAgent: ua,
      ipAddress: ip,
    });
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return NextResponse.json({ error: 'Cuenta bloqueada temporalmente' }, { status: 423 });
  }

  const ok = await verifyPassword(body.password, user.passwordHash);
  if (!ok) {
    const attempts = user.loginAttempts + 1;
    const maxAttempts = Number(process.env.RATE_LIMIT_LOGIN_ATTEMPTS ?? 5);
    const blockMin = Number(process.env.RATE_LIMIT_LOGIN_BLOCK_MINUTES ?? 30);
    const lockedUntil = attempts >= maxAttempts ? new Date(Date.now() + blockMin * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: attempts, lockedUntil },
    });
    await logAuditEvent({
      officerUid: user.id,
      officerUsername: user.username,
      action: 'LOGIN_FAILED',
      details: lockedUntil ? `Cuenta bloqueada tras ${attempts} intentos` : `Intento ${attempts}/${maxAttempts}`,
      userAgent: ua,
      ipAddress: ip,
    });
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  }

  const fullName = decryptField(user.fullName);

  await prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const token = await signSession(
    { uid: user.id, username: user.username, fullName, role: user.role as Role },
    MAX_AGE,
  );

  await logAuditEvent({
    officerUid: user.id,
    officerUsername: user.username,
    action: 'LOGIN',
    details: `Sesión iniciada por ${fullName}`,
    userAgent: ua,
    ipAddress: ip,
  });

  const response = NextResponse.json({
    user: { uid: user.id, username: user.username, fullName, role: user.role as Role },
  });
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_AGE,
    path: '/',
  });
  return response;
}

import { SignJWT, jwtVerify } from 'jose';
import type { Role, SessionUser } from '@/lib/types';

const ISSUER = 'seguranet';
const AUDIENCE = 'seguranet-app';

export interface SessionPayload extends SessionUser {
  iat?: number;
  exp?: number;
}

function getKey(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) throw new Error('JWT_SECRET no configurado');
  if (/^[0-9a-fA-F]+$/.test(raw) && raw.length % 2 === 0) {
    return Uint8Array.from(Buffer.from(raw, 'hex'));
  }
  return new TextEncoder().encode(raw);
}

export async function signSession(user: SessionUser, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({
    uid: user.uid,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(), { issuer: ISSUER, audience: AUDIENCE });
    if (!payload.uid || !payload.username || !payload.role) return null;
    return {
      uid: payload.uid as string,
      username: payload.username as string,
      fullName: (payload.fullName as string) ?? '',
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

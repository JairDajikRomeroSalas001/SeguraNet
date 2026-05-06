import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, type SessionPayload } from '@/lib/security/jwt';

const COOKIE = process.env.SESSION_COOKIE_NAME ?? 'seguranet_session';

export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(request: NextRequest): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getSession(request);
  if (!session) {
    return { response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }
  return { session };
}

export function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export function userAgent(request: NextRequest): string {
  return request.headers.get('user-agent') ?? 'unknown';
}

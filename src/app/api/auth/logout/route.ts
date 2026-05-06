import { NextRequest, NextResponse } from 'next/server';
import { getSession, clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { logAuditEvent } from '@/lib/audit-logger';

export const runtime = 'nodejs';

const COOKIE = process.env.SESSION_COOKIE_NAME ?? 'seguranet_session';

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (session) {
    await logAuditEvent({
      officerUid: session.uid,
      officerUsername: session.username,
      action: 'LOGOUT',
      details: 'Sesión cerrada manualmente',
      userAgent: userAgent(request),
      ipAddress: clientIp(request),
    });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}

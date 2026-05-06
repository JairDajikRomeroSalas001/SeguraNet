import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/security/jwt';

const COOKIE = process.env.SESSION_COOKIE_NAME ?? 'seguranet_session';

const PUBLIC_API = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/auth/bootstrap',
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) return NextResponse.next();
  if (PUBLIC_API.has(pathname)) return NextResponse.next();

  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 });
    res.cookies.set(COOKIE, '', { maxAge: 0, path: '/' });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};

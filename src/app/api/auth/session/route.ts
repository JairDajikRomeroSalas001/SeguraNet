import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/middleware/auth-helper';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({
    user: {
      uid: session.uid,
      username: session.username,
      fullName: session.fullName,
      role: session.role,
    },
  });
}

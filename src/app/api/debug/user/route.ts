import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'admin1' },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Usuario encontrado',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        passwordHashLength: user.passwordHash.length,
        passwordHashPrefix: user.passwordHash.substring(0, 50),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

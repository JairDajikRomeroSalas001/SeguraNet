import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, clientIp, userAgent } from '@/lib/middleware/auth-helper';
import { validateDni } from '@/lib/external-apis/reniec';
import { logAuditEvent } from '@/lib/audit-logger';

export const runtime = 'nodejs';

const schema = z.object({ dni: z.string().regex(/^\d{8}$/) });

export async function POST(request: NextRequest) {
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'DNI inválido' }, { status: 400 });
  }

  try {
    const result = await validateDni(body.dni);
    await logAuditEvent({
      officerUid: session.uid,
      officerUsername: session.username,
      action: 'EXTERNAL_API_CALL',
      details: `RENIEC ${body.dni} → ${result.valid ? 'OK' : 'NO_MATCH'} (source=${result.source})`,
      userAgent: userAgent(request),
      ipAddress: clientIp(request),
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: 'Servicio RENIEC no disponible', detail: String(err) },
      { status: 503 },
    );
  }
}

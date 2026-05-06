import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/middleware/auth-helper';
import { requireRole } from '@/lib/middleware/rbac';
import { listAuditEntries, verifyAuditEntry } from '@/lib/audit-logger';
import type { AuditAction } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  const { session } = guard;
  const denied = requireRole(session, ['superadmin', 'auditor']);
  if (denied) return denied;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 200), 1000);
  const officerUid = url.searchParams.get('officerId') ?? url.searchParams.get('officerUid') ?? undefined;
  const action = (url.searchParams.get('action') as AuditAction | null) ?? undefined;
  const startStr = url.searchParams.get('startDate');
  const endStr = url.searchParams.get('endDate');
  const startDate = startStr ? new Date(startStr) : undefined;
  const endDate = endStr ? new Date(endStr) : undefined;

  const entries = await listAuditEntries({ limit, officerUid, action, startDate, endDate });
  const verified = entries.map(e => ({ ...e, integrityValid: verifyAuditEntry(e) }));

  return NextResponse.json({ entries: verified });
}

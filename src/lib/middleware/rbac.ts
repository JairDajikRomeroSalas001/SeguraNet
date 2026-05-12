import 'server-only';
import { NextResponse } from 'next/server';
import type { Role } from '@/lib/types';
import type { SessionPayload } from '@/lib/security/jwt';

const RANK: Record<Role, number> = {
  superadmin: 4,
  oficial_operativo: 3,
  auditor: 2,
  readonly: 1,
};

export function hasRole(session: SessionPayload, allowed: ReadonlyArray<Role>): boolean {
  return allowed.includes(session.role);
}

export function requireRole(
  session: SessionPayload,
  allowed: ReadonlyArray<Role>,
): NextResponse | null {
  if (!hasRole(session, allowed)) {
    return NextResponse.json({ error: 'Acceso denegado para tu rol' }, { status: 403 });
  }
  return null;
}

export function isOwnerOrAdmin(session: SessionPayload, ownerUid: string): boolean {
  return session.role === 'superadmin' || session.uid === ownerUid;
}

export function canManageCase(session: SessionPayload, createdByUid: string): boolean {
  if (session.role === 'superadmin') return true;
  if (session.role === 'oficial_operativo') return session.uid === createdByUid;
  return false;
}

export function canViewCase(session: SessionPayload, _createdByUid: string): boolean {
  return ['superadmin', 'auditor', 'oficial_operativo', 'readonly'].includes(session.role);
}

export function rankOf(role: Role): number {
  return RANK[role];
}

import { addDays, differenceInHours, differenceInMinutes } from 'date-fns';
import type { RiskLevel, CaseStatus } from '@/lib/types';

export const RISK_DEADLINE_DAYS: Record<RiskLevel, number> = {
  'Leve': 30,
  'Moderado': 15,
  'Severo': 8,
  'Muy Severo': 7,
};

const TERMINAL_STATUSES: CaseStatus[] = ['Cerrado', 'Archivado'];

export function computeDeadline(createdAt: Date, riskLevel: RiskLevel): Date {
  return addDays(createdAt, RISK_DEADLINE_DAYS[riskLevel]);
}

export function isTerminalStatus(status: CaseStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export type DeadlineVariant = 'ok' | 'warning' | 'critical' | 'expired' | 'closed';

export interface DeadlineDisplay {
  label: string;
  variant: DeadlineVariant;
  isExpired: boolean;
}

export function getDeadlineDisplay(deadlineAt: Date, status: CaseStatus): DeadlineDisplay {
  if (isTerminalStatus(status)) {
    return { label: 'Cerrado', variant: 'closed', isExpired: false };
  }

  const now = new Date();
  const minutesLeft = differenceInMinutes(deadlineAt, now);
  const hoursLeft = differenceInHours(deadlineAt, now);

  if (minutesLeft <= 0) {
    return { label: 'VENCIDO', variant: 'expired', isExpired: true };
  }

  let label: string;
  if (hoursLeft >= 48) {
    const days = Math.floor(hoursLeft / 24);
    const hours = hoursLeft % 24;
    label = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  } else if (hoursLeft >= 1) {
    const mins = minutesLeft % 60;
    label = mins > 0 ? `${hoursLeft}h ${mins}m` : `${hoursLeft}h`;
  } else {
    label = `${minutesLeft}m`;
  }

  let variant: DeadlineVariant;
  if (hoursLeft <= 24) variant = 'critical';
  else if (hoursLeft <= 72) variant = 'warning';
  else variant = 'ok';

  return { label, variant, isExpired: false };
}

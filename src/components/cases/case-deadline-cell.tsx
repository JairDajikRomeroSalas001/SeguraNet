"use client";

import React, { useEffect, useState } from 'react';
import { getDeadlineDisplay, type DeadlineVariant } from '@/lib/cases/deadline';
import type { CaseStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const variantStyles: Record<DeadlineVariant, string> = {
  ok:       'text-green-700 bg-green-50 border-green-200',
  warning:  'text-amber-700 bg-amber-50 border-amber-200',
  critical: 'text-red-700 bg-red-100 border-red-300 animate-pulse',
  expired:  'text-white bg-destructive border-destructive',
  closed:   'text-muted-foreground bg-muted/30 border-muted',
};

interface Props {
  deadlineAt: string | null;
  status: CaseStatus;
}

export function CaseDeadlineCell({ deadlineAt, status }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!deadlineAt) return;
    if (status === 'Cerrado' || status === 'Archivado') return;
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, [deadlineAt, status]);

  if (!deadlineAt) {
    return <span className="text-[9px] text-muted-foreground">—</span>;
  }

  const { label, variant } = getDeadlineDisplay(new Date(deadlineAt), status);

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-black whitespace-nowrap uppercase tracking-wider',
      variantStyles[variant]
    )}>
      {label}
    </span>
  );
}

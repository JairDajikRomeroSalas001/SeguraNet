"use client";

import React, { useMemo, useState } from 'react';
import { PoliceCase } from '@/lib/types';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, AlertTriangle, ShieldAlert } from 'lucide-react';
import {
  startOfDay, startOfWeek, startOfMonth,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  subDays, subWeeks, subMonths, addDays, addWeeks, addMonths,
  format, parseISO, isValid,
} from 'date-fns';
import { es } from 'date-fns/locale';

type Granularity = 'day' | 'week' | 'month';

const RISK_ORDER = ['Muy Severo', 'Severo', 'Moderado', 'Leve'] as const;
const RISK_COLORS: Record<string, string> = {
  'Muy Severo': 'text-red-600',
  Severo: 'text-orange-600',
  Moderado: 'text-yellow-600',
  Leve: 'text-green-600',
};

const chartConfig = {
  count: {
    label: 'Expedientes',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

interface Bucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

interface BucketSpec {
  label: string;
  rangeLabel: string;
  buckets: Bucket[];
}

function buildBuckets(granularity: Granularity): BucketSpec {
  const now = new Date();

  if (granularity === 'day') {
    const end = startOfDay(now);
    const start = startOfDay(subDays(end, 29));
    const days = eachDayOfInterval({ start, end });
    return {
      label: 'Últimos 30 días',
      rangeLabel: `${format(start, 'dd MMM yyyy', { locale: es })} — ${format(end, 'dd MMM yyyy', { locale: es })}`,
      buckets: days.map(d => ({
        key: format(d, 'yyyy-MM-dd'),
        label: format(d, 'dd MMM', { locale: es }),
        start: startOfDay(d),
        end: startOfDay(addDays(d, 1)),
      })),
    };
  }

  if (granularity === 'week') {
    const start = startOfWeek(subWeeks(now, 11), { weekStartsOn: 1 });
    const end = startOfWeek(now, { weekStartsOn: 1 });
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    return {
      label: 'Últimas 12 semanas',
      rangeLabel: `${format(start, 'dd MMM yyyy', { locale: es })} — actual`,
      buckets: weeks.map(w => ({
        key: format(w, 'yyyy-MM-dd'),
        label: format(w, "dd MMM", { locale: es }),
        start: w,
        end: startOfWeek(addWeeks(w, 1), { weekStartsOn: 1 }),
      })),
    };
  }

  const start = startOfMonth(subMonths(now, 11));
  const end = startOfMonth(now);
  const months = eachMonthOfInterval({ start, end });
  return {
    label: 'Últimos 12 meses',
    rangeLabel: `${format(start, 'MMM yyyy', { locale: es })} — ${format(end, 'MMM yyyy', { locale: es })}`,
    buckets: months.map(m => ({
      key: format(m, 'yyyy-MM'),
      label: format(m, 'MMM yy', { locale: es }),
      start: m,
      end: startOfMonth(addMonths(m, 1)),
    })),
  };
}

export function CasesStats({ cases }: { cases: PoliceCase[] }) {
  const [granularity, setGranularity] = useState<Granularity>('day');

  const spec = useMemo(() => buildBuckets(granularity), [granularity]);

  const inRangeCases = useMemo(() => {
    if (spec.buckets.length === 0) return [];
    const rangeStart = spec.buckets[0].start;
    const rangeEnd = spec.buckets[spec.buckets.length - 1].end;
    return cases.filter(c => {
      const d = parseISO(c.entryDate);
      if (!isValid(d)) return false;
      return d >= rangeStart && d < rangeEnd;
    });
  }, [cases, spec]);

  const chartData = useMemo(() => {
    return spec.buckets.map(b => {
      const count = inRangeCases.reduce((acc, c) => {
        const d = parseISO(c.entryDate);
        return d >= b.start && d < b.end ? acc + 1 : acc;
      }, 0);
      return { label: b.label, count };
    });
  }, [spec, inRangeCases]);

  const violenceStats = useMemo(() => {
    const counter = new Map<string, number>();
    let totalAppearances = 0;
    inRangeCases.forEach(c => {
      c.violenceType.forEach(t => {
        counter.set(t, (counter.get(t) ?? 0) + 1);
        totalAppearances += 1;
      });
    });
    return Array.from(counter.entries())
      .map(([type, count]) => ({
        type,
        count,
        pct: totalAppearances === 0 ? 0 : Math.round((count / totalAppearances) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [inRangeCases]);

  const riskStats = useMemo(() => {
    const total = inRangeCases.length;
    const counter = new Map<string, number>();
    inRangeCases.forEach(c => counter.set(c.riskLevel, (counter.get(c.riskLevel) ?? 0) + 1));
    return RISK_ORDER.map(level => {
      const count = counter.get(level) ?? 0;
      return {
        level,
        count,
        pct: total === 0 ? 0 : Math.round((count / total) * 100),
      };
    });
  }, [inRangeCases]);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Expedientes registrados
            </CardTitle>
            <CardDescription className="text-[11px] font-bold uppercase tracking-wider mt-1 text-muted-foreground">
              {spec.label} · {spec.rangeLabel}
            </CardDescription>
          </div>
          <Tabs value={granularity} onValueChange={v => setGranularity(v as Granularity)}>
            <TabsList className="h-9 p-1 bg-muted/30 border">
              <TabsTrigger value="day" className="text-[10px] font-black uppercase px-3">Día</TabsTrigger>
              <TabsTrigger value="week" className="text-[10px] font-black uppercase px-3">Semana</TabsTrigger>
              <TabsTrigger value="month" className="text-[10px] font-black uppercase px-3">Mes</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {inRangeCases.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Sin registros en este rango.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={10}
                  interval="preserveStartEnd"
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} width={28} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" /> Tipos de violencia más frecuentes
            </CardTitle>
            <CardDescription className="text-[11px] font-bold uppercase tracking-wider mt-1 text-muted-foreground">
              Sobre {inRangeCases.length} expediente{inRangeCases.length === 1 ? '' : 's'} en el rango
            </CardDescription>
          </CardHeader>
          <CardContent>
            {violenceStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin registros en este rango.</p>
            ) : (
              <>
                <p className="text-[10px] text-muted-foreground/80 italic mb-3 leading-tight">
                  Un expediente puede incluir varios tipos. Los porcentajes se calculan sobre el total de apariciones, no sobre el número de expedientes.
                </p>
                <ol className="space-y-2">
                {violenceStats.map((v, idx) => (
                  <li
                    key={v.type}
                    className="flex items-baseline justify-between gap-3 text-sm border-b border-border/40 pb-2 last:border-0"
                  >
                    <span className="font-bold text-foreground">
                      <span className="text-muted-foreground font-mono mr-2">{idx + 1}.</span>
                      {v.type}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                      {v.count} {v.count === 1 ? 'caso' : 'casos'} ({v.pct}%)
                    </span>
                  </li>
                ))}
                </ol>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" /> Distribución por nivel de riesgo
            </CardTitle>
            <CardDescription className="text-[11px] font-bold uppercase tracking-wider mt-1 text-muted-foreground">
              Sobre {inRangeCases.length} expediente{inRangeCases.length === 1 ? '' : 's'} en el rango
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inRangeCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin registros en este rango.</p>
            ) : (
              <ul className="space-y-2">
                {riskStats.map(r => (
                  <li
                    key={r.level}
                    className="flex items-baseline justify-between gap-3 text-sm border-b border-border/40 pb-2 last:border-0"
                  >
                    <span className={`font-bold ${RISK_COLORS[r.level]}`}>
                      <span className="text-muted-foreground font-mono mr-2">•</span>
                      {r.level}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                      {r.count} {r.count === 1 ? 'caso' : 'casos'} ({r.pct}%)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

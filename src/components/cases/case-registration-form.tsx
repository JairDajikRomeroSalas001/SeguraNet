"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  FilePlus, FileText, Clock, Calendar, Building2, Send, Hash, User, ShieldAlert,
  ChevronRight, ChevronLeft, Search, Phone, Map, AlertTriangle, Shield, MapPin, ClipboardList, UserCheck, Save, Lock,
  Plus, X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PoliceCase } from '@/lib/types';
import { useAuth } from '@/components/auth-context';
import { createCase } from '@/lib/store';
import { api, ApiError } from '@/lib/api-client';

const personSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  dni: z.string().length(8, '8 dígitos').regex(/^\d+$/, 'Solo números'),
  phone: z.string().length(9, '9 dígitos').regex(/^9\d{8}$/, 'Empieza con 9'),
  street: z.string().optional().default(''),
  number: z.string().optional().default(''),
  district: z.string().min(1, 'Distrito requerido'),
  annex: z.string().optional().default(''),
  community: z.string().optional().default(''),
  reference: z.string().optional().default(''),
});

const caseSchema = z.object({
  caseNumber: z.string().min(1),
  assignedOfficer: z.string().min(1),
  origin: z.string().min(1),
  entryDate: z.string().min(1),
  entryTime: z.string().min(1),
  victims: z.array(personSchema).min(1, 'Mínimo 1 víctima'),
  aggressors: z.array(personSchema).min(1, 'Mínimo 1 agresor'),
  violenceType: z.array(z.string()).min(1, 'Seleccione al menos un tipo'),
  riskLevel: z.enum(['Leve', 'Moderado', 'Severo', 'Muy Severo']),
  incidentDescription: z.string().min(1),
  incidentDate: z.string().min(1),
  incidentTime: z.string().min(1),
  incidentLocation: z.string().min(1),
  riskFactors: z.array(z.string()).default([]),
  additionalObservations: z.string().optional().default(''),
});

type FormData = z.infer<typeof caseSchema>;

const EMPTY_PERSON = {
  name: '', dni: '', phone: '', street: '', number: '',
  district: 'Paucartambo', annex: '', community: '', reference: '',
};

const originOptions = [
  'Juez de Paz', 'Juzgado de Familia', 'Juzgado Especializado de Familia', 'Juzgado Mixto',
].sort();

const violenceOptions = [
  { value: 'Violencia física', label: 'Violencia física' },
  { value: 'Violencia Psicológica', label: 'Violencia Psicológica' },
  { value: 'Violencia económica', label: 'Violencia económica' },
  { value: 'Violencia sexual', label: 'Violencia sexual' },
  { value: 'Violencia patrimonial', label: 'Violencia patrimonial' },
  { value: 'Violencia mixta', label: 'Violencia mixta' },
];

const riskOptions = [
  { value: 'Leve', label: 'Riesgo Leve', color: 'border-emerald-200 bg-emerald-50 text-emerald-700', accent: 'bg-emerald-500', hover: 'hover:border-emerald-400 hover:bg-emerald-100' },
  { value: 'Moderado', label: 'Moderado', color: 'border-amber-200 bg-amber-50 text-amber-700', accent: 'bg-amber-500', hover: 'hover:border-amber-400 hover:bg-amber-100' },
  { value: 'Severo', label: 'Severo', color: 'border-orange-200 bg-orange-50 text-orange-700', accent: 'bg-orange-500', hover: 'hover:border-orange-400 hover:bg-orange-100' },
  { value: 'Muy Severo', label: 'Muy Severo', color: 'border-rose-200 bg-rose-50 text-rose-700', accent: 'bg-rose-500', hover: 'hover:border-rose-400 hover:bg-rose-100' },
] as const;

const riskFactorOptions = [
  { id: 'amenazas_muerte', label: 'Amenazas de muerte' },
  { id: 'consumo_alcohol_drogas', label: 'Consumo de alcohol o drogas' },
  { id: 'menores_involucrados', label: 'Menores involucrados' },
  { id: 'antecedentes_violencia', label: 'Antecedentes de violencia' },
  { id: 'uso_armas', label: 'Uso de armas' },
  { id: 'violencia_escalada', label: 'Violencia escalada' },
  { id: 'aislamiento_victima', label: 'Aislamiento de la víctima' },
  { id: 'control_economico', label: 'Control económico' },
];

// ─── PersonFormFields: Renderiza los campos de una persona ────────────────────

const PersonFormFields = ({
  fieldPrefix,
  index,
  title,
  color,
  badgeColor,
  form,
  onValidateDni,
  isValidating,
  onRemove,
  canRemove,
}: {
  fieldPrefix: `victims.${number}` | `aggressors.${number}`;
  index: number;
  title: string;
  color: string;
  badgeColor: string;
  form: UseFormReturn<FormData>;
  onValidateDni: () => void;
  isValidating: boolean;
  onRemove?: () => void;
  canRemove: boolean;
}) => {
  const onlyDigits = (e: React.ChangeEvent<HTMLInputElement>, ch: (v: string) => void) =>
    ch(e.target.value.replace(/\D/g, ''));

  return (
    <div className="space-y-4 p-5 rounded-xl border bg-card/50 shadow-sm transition-all duration-300 animate-in fade-in-0 slide-in-from-top-2">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <h4 className={`text-xs font-bold ${color} uppercase tracking-widest flex items-center gap-2`}>
          <User className="h-4 w-4" />
          {title}
          <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-black text-white ${badgeColor}`}>
            {index + 1}
          </span>
        </h4>
        {canRemove && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 gap-1 text-[9px] font-black text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg px-2"
          >
            <X className="h-3 w-3" /> QUITAR
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${fieldPrefix}.dni`} render={({ field }) => (
          <FormItem>
            <FormLabel>DNI (8 dígitos)</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input placeholder="8 dígitos" maxLength={8} inputMode="numeric" {...field} onChange={e => onlyDigits(e, field.onChange)} />
              </FormControl>
              <Button type="button" variant="secondary" size="icon" onClick={onValidateDni} disabled={isValidating}>
                <Search className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name={`${fieldPrefix}.name`} render={({ field }) => (
          <FormItem><FormLabel>Nombres y Apellidos</FormLabel><FormControl><Input placeholder="Nombre Completo" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField control={form.control} name={`${fieldPrefix}.phone`} render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Phone className="h-3 w-3" /> Celular (9 dígitos)</FormLabel>
            <FormControl><Input placeholder="999888777" maxLength={9} inputMode="numeric" {...field} onChange={e => onlyDigits(e, field.onChange)} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name={`${fieldPrefix}.street`} render={({ field }) => (
          <FormItem><FormLabel>Calle / Jirón / Av.</FormLabel><FormControl><Input placeholder="Ej: Jr. Cusco" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name={`${fieldPrefix}.number`} render={({ field }) => (
          <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123 o S/N" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField control={form.control} name={`${fieldPrefix}.district`} render={({ field }) => (
          <FormItem><FormLabel>Distrito</FormLabel><FormControl><Input placeholder="Paucartambo" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name={`${fieldPrefix}.annex`} render={({ field }) => (
          <FormItem><FormLabel>Anexo</FormLabel><FormControl><Input placeholder="Ej: Anexo 10" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name={`${fieldPrefix}.community`} render={({ field }) => (
          <FormItem><FormLabel>Comunidad</FormLabel><FormControl><Input placeholder="Ej: Comunidad Campesina" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-1 gap-4">
        <FormField control={form.control} name={`${fieldPrefix}.reference`} render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2"><Map className="h-3 w-3" /> Referencia</FormLabel><FormControl><Input placeholder="Ej: Cerca al mercado" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
    </div>
  );
};

// ─── Formulario Principal ─────────────────────────────────────────────────────

export function CaseRegistrationForm({
  onCaseAdded,
  initialData,
}: {
  onCaseAdded: (data?: PoliceCase) => void;
  initialData?: PoliceCase;
}) {
  const [step, setStep] = useState(1);
  const [validatingDnis, setValidatingDnis] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const isEditing = !!initialData;

  const getCurrentTime = () =>
    new Date().toLocaleTimeString('es-PE', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const form = useForm<FormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: initialData
      ? {
          caseNumber: initialData.caseNumber,
          assignedOfficer: initialData.assignedOfficer,
          origin: initialData.origin,
          entryDate: initialData.entryDate,
          entryTime: initialData.entryTime,
          victims: initialData.victims,
          aggressors: initialData.aggressors,
          violenceType: initialData.violenceType,
          riskLevel: initialData.riskLevel,
          incidentDescription: initialData.incidentDescription,
          incidentDate: initialData.incidentDate,
          incidentTime: initialData.incidentTime,
          incidentLocation: initialData.incidentLocation,
          riskFactors: initialData.riskFactors,
          additionalObservations: initialData.additionalObservations,
        }
      : {
          caseNumber: '',
          assignedOfficer: user?.fullName?.toUpperCase() ?? '',
          origin: '',
          entryDate: new Date().toISOString().split('T')[0],
          entryTime: getCurrentTime(),
          victims: [{ ...EMPTY_PERSON }],
          aggressors: [{ ...EMPTY_PERSON }],
          violenceType: [],
          riskLevel: 'Leve',
          incidentDescription: '',
          incidentDate: new Date().toISOString().split('T')[0],
          incidentTime: '',
          incidentLocation: '',
          riskFactors: [],
          additionalObservations: '',
        },
  });

  const {
    fields: victimFields,
    append: appendVictim,
    remove: removeVictim,
  } = useFieldArray({ control: form.control, name: 'victims' });

  const {
    fields: aggressorFields,
    append: appendAggressor,
    remove: removeAggressor,
  } = useFieldArray({ control: form.control, name: 'aggressors' });

  const validateDni = async (fieldPrefix: string) => {
    const dni = form.getValues(`${fieldPrefix}.dni` as any);
    if (!/^\d{8}$/.test(dni)) {
      toast({ variant: 'destructive', title: 'DNI inválido', description: '8 dígitos numéricos.' });
      return;
    }
    setValidatingDnis(prev => ({ ...prev, [fieldPrefix]: true }));
    try {
      const res = await api.post<{ valid: boolean; fullName: string | null }>('/api/external/reniec', { dni });
      if (res.valid && res.fullName) {
        form.setValue(`${fieldPrefix}.name` as any, res.fullName);
        toast({ title: 'DNI validado', description: res.fullName });
      } else {
        toast({ title: 'No encontrado', description: 'Complete manualmente.' });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'RENIEC no disponible';
      toast({ variant: 'destructive', title: 'Error RENIEC', description: msg });
    } finally {
      setValidatingDnis(prev => ({ ...prev, [fieldPrefix]: false }));
    }
  };

  const nextStep = async () => {
    let fields: (keyof FormData)[] = [];
    if (step === 1) fields = ['caseNumber', 'assignedOfficer', 'origin', 'entryDate', 'entryTime'];
    if (step === 2) fields = ['victims', 'aggressors'];
    if (step === 3) fields = ['violenceType', 'riskLevel'];
    const ok = await form.trigger(fields);
    if (ok) setStep(step + 1);
    else toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Verifique los campos.' });
  };

  const onSubmit = async (values: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (isEditing) {
        onCaseAdded({ ...initialData!, ...values, tags: [...values.violenceType, values.riskLevel] });
      } else {
        await createCase({ ...values, tags: [...values.violenceType, values.riskLevel] } as any);
        toast({ title: 'Expediente registrado', description: `${values.caseNumber} guardado.` });
        onCaseAdded();
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al guardar';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl border-primary/10 overflow-hidden">
      <CardHeader className="bg-primary py-4">
        <div className="flex justify-between items-center text-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isEditing ? <FileText className="h-5 w-5" /> : <FilePlus className="h-5 w-5" />}
            {isEditing ? `Editando: ${initialData!.caseNumber}` : 'Registro de Denuncia Policial'}
          </CardTitle>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={cn('h-2 w-8 rounded-full transition-all', s <= step ? 'bg-white' : 'bg-white/20')} />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 border-b pb-2"><FileText className="h-4 w-4" /> Paso 1: Datos del Expediente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="caseNumber" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4 text-primary/70" /> Número de Expediente</FormLabel><FormControl><Input placeholder="EXP-2024-001" className="font-mono font-bold" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="assignedOfficer" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary/70" /> Oficial Asignado</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input readOnly className="bg-muted/50 font-black uppercase text-primary border-primary/20 pl-10 cursor-not-allowed" {...field} />
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px] font-bold text-emerald-600 uppercase">Identidad por sesión activa</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="origin" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary/70" /> Origen</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger></FormControl>
                        <SelectContent>{originOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="entryDate" render={({ field }) => (
                      <FormItem><FormLabel className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary/70" /> Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="entryTime" render={({ field }) => (
                      <FormItem><FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary/70" /> Hora</FormLabel><FormControl><Input type="time" step="1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 border-b pb-2"><User className="h-4 w-4" /> Paso 2: Víctimas y Agresores</h3>

                {/* ── Sección Víctimas ── */}
                <div className="space-y-4">
                  {victimFields.map((field, index) => (
                    <PersonFormFields
                      key={field.id}
                      fieldPrefix={`victims.${index}`}
                      index={index}
                      title={victimFields.length === 1 ? 'Datos de la Víctima' : `Víctima`}
                      color="text-primary"
                      badgeColor="bg-primary"
                      form={form}
                      onValidateDni={() => validateDni(`victims.${index}`)}
                      isValidating={!!validatingDnis[`victims.${index}`]}
                      onRemove={() => removeVictim(index)}
                      canRemove={victimFields.length > 1}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendVictim({ ...EMPTY_PERSON })}
                    className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 h-11 gap-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar otra víctima
                    <span className="text-[10px] font-medium normal-case text-muted-foreground ml-1">
                      ({victimFields.length} registrada{victimFields.length !== 1 ? 's' : ''})
                    </span>
                  </Button>
                </div>

                <Separator className="opacity-30" />

                {/* ── Sección Agresores ── */}
                <div className="space-y-4">
                  {aggressorFields.map((field, index) => (
                    <PersonFormFields
                      key={field.id}
                      fieldPrefix={`aggressors.${index}`}
                      index={index}
                      title={aggressorFields.length === 1 ? 'Datos del Agresor' : `Agresor`}
                      color="text-destructive"
                      badgeColor="bg-destructive"
                      form={form}
                      onValidateDni={() => validateDni(`aggressors.${index}`)}
                      isValidating={!!validatingDnis[`aggressors.${index}`]}
                      onRemove={() => removeAggressor(index)}
                      canRemove={aggressorFields.length > 1}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendAggressor({ ...EMPTY_PERSON })}
                    className="w-full border-dashed border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50 h-11 gap-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar otro agresor
                    <span className="text-[10px] font-medium normal-case text-muted-foreground ml-1">
                      ({aggressorFields.length} registrado{aggressorFields.length !== 1 ? 's' : ''})
                    </span>
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 border-b pb-2"><ShieldAlert className="h-4 w-4" /> Paso 3: Clasificación</h3>
                <FormField control={form.control} name="violenceType" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-bold uppercase tracking-tight text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4 text-amber-600" /> Tipo de Violencia</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border p-4 rounded-xl bg-muted/20">
                      {violenceOptions.map(option => (
                        <FormItem key={option.value} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(option.value)}
                              onCheckedChange={checked => checked
                                ? field.onChange([...(field.value ?? []), option.value])
                                : field.onChange(field.value?.filter(v => v !== option.value))}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">{option.label}</FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="riskLevel" render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="flex items-center gap-2 font-bold uppercase tracking-tight text-xs text-muted-foreground"><Shield className="h-4 w-4" /> Nivel de Riesgo</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {riskOptions.map(opt => (
                          <FormItem key={opt.value} className="space-y-0">
                            <FormControl><RadioGroupItem value={opt.value} className="sr-only" /></FormControl>
                            <FormLabel className={cn('relative flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer h-full text-center', opt.hover, field.value === opt.value ? cn('border-foreground ring-4 ring-offset-2 ring-primary/20 scale-[1.02] shadow-lg', opt.color) : 'border-muted bg-card/50 grayscale-[0.5] opacity-70')}>
                              <span className={cn('font-extrabold text-xs uppercase mb-2 tracking-widest', field.value === opt.value ? 'opacity-100' : 'opacity-60')}>{opt.label}</span>
                              <div className={cn('w-3 h-3 rounded-full border-2 border-white', opt.accent, field.value === opt.value ? 'scale-150' : 'scale-100')} />
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 border-b pb-2"><ClipboardList className="h-4 w-4" /> Paso 4: Detalles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="incidentDate" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary/70" /> Fecha del incidente</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="incidentTime" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary/70" /> Hora aproximada</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="incidentLocation" render={({ field }) => (
                  <FormItem><FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary/70" /> Lugar</FormLabel><FormControl><Input placeholder="Lugar exacto" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="incidentDescription" render={({ field }) => (
                  <FormItem><FormLabel>Descripción del incidente</FormLabel><FormControl><Textarea placeholder="Describa los hechos..." className="min-h-[100px] resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="space-y-4">
                  <FormLabel className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Indicadores de riesgo</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-xl bg-muted/20">
                    {riskFactorOptions.map(option => (
                      <FormField key={option.id} control={form.control} name="riskFactors" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value?.includes(option.id)} onCheckedChange={c => c
                              ? field.onChange([...(field.value ?? []), option.id])
                              : field.onChange(field.value?.filter(v => v !== option.id))} />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">{option.label}</FormLabel>
                        </FormItem>
                      )} />
                    ))}
                  </div>
                </div>
                <FormField control={form.control} name="additionalObservations" render={({ field }) => (
                  <FormItem><FormLabel>Observaciones adicionales</FormLabel><FormControl><Textarea placeholder="Información adicional..." className="min-h-[80px] resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            )}

            <Separator />
            <div className="flex justify-between gap-4">
              {step > 1 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)}><ChevronLeft className="mr-2 h-4 w-4" /> Anterior</Button>}
              <div className="ml-auto flex gap-2">
                {step < 4 ? (
                  <Button type="button" onClick={nextStep} className="px-8">Siguiente <ChevronRight className="ml-2 h-4 w-4" /></Button>
                ) : (
                  <Button type="submit" className="bg-primary hover:bg-primary/90 shadow-xl px-10 h-11" disabled={isSubmitting}>
                    {isEditing ? <Save className="mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />}
                    {isEditing ? 'ACTUALIZAR' : 'GUARDAR EN SISTEMA'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


"use client"

import React, { useState, useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  FilePlus, FileText, Info, Clock, Calendar, Building2, 
  Send, Hash, User, ShieldAlert, 
  ChevronRight, ChevronLeft, Search, Phone, Map, AlertTriangle, Shield, MapPin, ClipboardList, UserCheck, Save, Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addCase } from '@/lib/store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PoliceCase } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit-logger';
import { useAuth } from '@/components/auth-context';
import { generateDataHash } from '@/lib/crypto';

const personSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  dni: z.string()
    .length(8, 'El DNI debe tener exactamente 8 dígitos')
    .regex(/^\d+$/, 'El DNI solo debe contener números'),
  phone: z.string()
    .length(9, 'El celular debe tener exactamente 9 dígitos')
    .regex(/^9\d{8}$/, 'Debe empezar con 9 y contener solo 9 números'),
  street: z.string().min(1, 'Calle requerida'),
  number: z.string().min(1, 'Número requerido'),
  district: z.string().min(1, 'Distrito requerido'),
  reference: z.string().optional(),
});

const caseSchema = z.object({
  caseNumber: z.string().min(1, 'Número de expediente requerido'),
  assignedOfficer: z.string().min(1, 'Oficial asignado requerido'),
  origin: z.string().min(1, 'Origen requerido'),
  entryDate: z.string().min(1, 'Fecha requerida'),
  entryTime: z.string().min(1, 'Hora requerida'),
  victim: personSchema,
  aggressor: personSchema,
  violenceType: z.string().min(1, 'Tipo de violencia requerido'),
  riskLevel: z.enum(['Leve', 'Moderado', 'Severo', 'Muy Severo']),
  incidentDescription: z.string().min(1, 'Descripción requerida'),
  incidentDate: z.string().min(1, 'Fecha del incidente requerida'),
  incidentTime: z.string().min(1, 'Hora aproximada requerida'),
  incidentLocation: z.string().min(1, 'Lugar del incidente requerido'),
  riskFactors: z.array(z.string()).default([]),
  additionalObservations: z.string().optional(),
});

type FormData = z.infer<typeof caseSchema>;

const originOptions = [
  "Centro de Emergencia Mujer",
  "Demuna Municipal",
  "Denuncia Directa",
  "Hospital Regional",
  "Juez de Paz",
  "Juzgado de Familia",
  "Juzgado Especializado de Familia",
  "Juzgado Mixto"
].sort((a, b) => a.localeCompare(b));

const violenceOptions = [
  { value: "Violencia física", label: "Violencia física (agresión corporal, golpes, lesiones)" },
  { value: "Violencia Psicológica", label: "Violencia Psicológica (amenazas, humillaciones, control)" },
  { value: "Violencia económica", label: "Violencia económica (control de recursos, privación económica)" },
  { value: "Violencia sexual", label: "Violencia sexual (actos contra la libertad sexual)" },
  { value: "Violencia patrimonial", label: "Violencia patrimonial (destrucción de bienes, despojo)" },
  { value: "Violencia mixta", label: "Violencia mixta (combinación de varios tipos)" },
];

const riskOptions = [
  { 
    value: "Leve", 
    label: "Riesgo Leve", 
    desc: "Riesgo bajo, sin indicadores de peligro inmediato para la integridad física o la vida.", 
    color: "border-emerald-200 bg-emerald-50 text-emerald-700", 
    accent: "bg-emerald-500",
    hover: "hover:border-emerald-400 hover:bg-emerald-100"
  },
  { 
    value: "Moderado", 
    label: "Moderado", 
    desc: "Riesgo medio, existen actos de violencia pero no riesgo inminente. Requiere seguimiento regular.", 
    color: "border-amber-200 bg-amber-50 text-amber-700", 
    accent: "bg-amber-500",
    hover: "hover:border-amber-400 hover:bg-amber-100"
  },
  { 
    value: "Severo", 
    label: "Severo", 
    desc: "Riesgo alto, existe probabilidad de nuevas agresiones graves. Requiere intervención prioritaria.", 
    color: "border-orange-200 bg-orange-50 text-orange-700", 
    accent: "bg-orange-500",
    hover: "hover:border-orange-400 hover:bg-orange-100"
  },
  { 
    value: "Muy Severo", 
    label: "Muy Severo", 
    desc: "Riesgo extremo, peligro inminente para la vida de la víctima. Requiere medidas de protección urgentes.", 
    color: "border-rose-200 bg-rose-50 text-rose-700", 
    accent: "bg-rose-500",
    hover: "hover:border-rose-400 hover:bg-rose-100"
  },
] as const;

const riskFactorOptions = [
  { id: "amenazas_muerte", label: "Amenazas de muerte" },
  { id: "consumo_alcohol_drogas", label: "Consumo de alcohol o drogas" },
  { id: "menores_involucrados", label: "Menores involucrados" },
  { id: "antecedentes_violencia", label: "Antecedentes de violencia" },
  { id: "uso_armas", label: "Uso de armas" },
  { id: "violencia_escalada", label: "Violencia escalada" },
  { id: "aislamiento_victima", label: "Aislamiento de la víctima" },
  { id: "control_economico", label: "Control económico" },
];

const PersonFormFields = ({ 
  type, 
  title, 
  color, 
  form, 
  validateDni, 
  isValidating 
}: { 
  type: 'victim' | 'aggressor', 
  title: string, 
  color: string, 
  form: UseFormReturn<FormData>,
  validateDni: (type: 'victim' | 'aggressor') => void,
  isValidating: boolean
}) => {
  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, fieldChange: (val: string) => void) => {
    const value = e.target.value.replace(/\D/g, '');
    fieldChange(value);
  };

  return (
    <div className="space-y-4 p-5 rounded-xl border bg-card/50 shadow-sm">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <h4 className={`text-xs font-bold ${color} uppercase tracking-widest flex items-center gap-2`}>
          <User className="h-4 w-4" /> {title}
        </h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${type}.dni`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>DNI (8 dígitos)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input 
                    placeholder="8 dígitos numéricos" 
                    maxLength={8} 
                    inputMode="numeric"
                    {...field} 
                    onChange={(e) => handleNumericInput(e, field.onChange)}
                  />
                </FormControl>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="icon" 
                  onClick={() => validateDni(type)}
                  disabled={isValidating}
                >
                  <Search className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${type}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombres y Apellidos</FormLabel>
              <FormControl><Input placeholder="Nombre Completo" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name={`${type}.phone`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Phone className="h-3 w-3" /> Celular (9 dígitos, empieza con 9)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="999888777" 
                  maxLength={9} 
                  inputMode="numeric"
                  {...field} 
                  onChange={(e) => handleNumericInput(e, field.onChange)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${type}.street`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calle / Jirón / Av.</FormLabel>
              <FormControl><Input placeholder="Ej: Jr. Cusco" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${type}.number`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número</FormLabel>
              <FormControl><Input placeholder="123 o S/N" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${type}.district`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Distrito</FormLabel>
              <FormControl><Input placeholder="Ej: Paucartambo" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${type}.reference`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Map className="h-3 w-3" /> Referencia</FormLabel>
              <FormControl><Input placeholder="Ej: Cerca al mercado" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export function CaseRegistrationForm({ 
  onCaseAdded, 
  initialData 
}: { 
  onCaseAdded: (data?: any) => void,
  initialData?: PoliceCase
}) {
  const [step, setStep] = useState(1);
  const [isValidatingDni, setIsValidatingDni] = useState({ victim: false, aggressor: false });
  const { toast } = useToast();
  const { user } = useAuth();

  const isEditing = !!initialData;

  const getCurrentTimeWithSeconds = () => {
    const now = new Date();
    return now.toLocaleTimeString('es-PE', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const form = useForm<FormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: initialData || {
      caseNumber: '',
      assignedOfficer: user?.username ? user.username.toUpperCase() : '',
      origin: '',
      entryDate: new Date().toISOString().split('T')[0],
      entryTime: getCurrentTimeWithSeconds(),
      victim: { name: '', dni: '', phone: '', street: '', number: '', district: 'Paucartambo', reference: '' },
      aggressor: { name: '', dni: '', phone: '', street: '', number: '', district: 'Paucartambo', reference: '' },
      violenceType: '',
      riskLevel: 'Leve',
      incidentDescription: '',
      incidentDate: new Date().toISOString().split('T')[0],
      incidentTime: '',
      incidentLocation: '',
      riskFactors: [],
      additionalObservations: '',
    },
  });

  const validateDni = async (type: 'victim' | 'aggressor') => {
    const dni = form.getValues(`${type}.dni`);
    if (dni.length !== 8 || !/^\d+$/.test(dni)) {
      toast({ variant: "destructive", title: "DNI inválido", description: "Debe tener 8 dígitos numéricos." });
      return;
    }

    setIsValidatingDni(prev => ({ ...prev, [type]: true }));
    
    setTimeout(() => {
      setIsValidatingDni(prev => ({ ...prev, [type]: false }));
      const mockNames: Record<string, string> = {
        '12345678': 'JUAN PEREZ MENDOZA',
        '87654321': 'MARIA LOPEZ GARCIA',
      };
      
      if (mockNames[dni]) {
        form.setValue(`${type}.name`, mockNames[dni]);
        toast({ title: "DNI Validado", description: `Se encontró a: ${mockNames[dni]}` });
      } else {
        toast({ title: "No encontrado", description: "DNI no registrado en el simulador. Complete manualmente." });
      }
    }, 1000);
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['caseNumber', 'assignedOfficer', 'origin', 'entryDate', 'entryTime'];
    if (step === 2) fieldsToValidate = ['victim', 'aggressor'];
    if (step === 3) fieldsToValidate = ['violenceType', 'riskLevel'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    } else {
      toast({ 
        variant: "destructive", 
        title: "Datos inválidos o incompletos", 
        description: "Por favor verifique que el DNI tenga 8 dígitos y el celular 9 dígitos (empezando con 9)." 
      });
    }
  };

  const onSubmit = async (values: FormData) => {
    const integrityHash = await generateDataHash(values);
    
    if (isEditing) {
      onCaseAdded({
        ...initialData,
        ...values,
        tags: [values.violenceType, values.riskLevel],
        integrityHash,
      });
    } else {
      addCase({
        ...values,
        status: 'Pendiente',
        tags: [values.violenceType, values.riskLevel],
      });
      
      logAuditEvent(user?.username || 'unknown', 'CREATE_EXPEDIENT', `Registered new expedient: ${values.caseNumber}`);
      
      toast({ title: "Expediente Guardado", description: `Expediente ${values.caseNumber} registrado con éxito.` });
      onCaseAdded();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl border-primary/10 overflow-hidden">
      <CardHeader className="bg-primary py-4">
        <div className="flex justify-between items-center text-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isEditing ? <FileText className="h-5 w-5" /> : <FilePlus className="h-5 w-5" />} 
            {isEditing ? `Editando Expediente: ${initialData.caseNumber}` : 'Registro de Denuncia Policial'}
          </CardTitle>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={cn(
                "h-2 w-8 rounded-full transition-all duration-300", 
                s <= step ? 'bg-white' : 'bg-white/20'
              )} />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 border-b pb-2"><FileText className="h-4 w-4" /> Paso 1: Datos del Expediente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="caseNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4 text-primary/70" /> Número de Expediente</FormLabel>
                      <FormControl><Input placeholder="Ej: EXP-2024-001" className="font-mono font-bold" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="assignedOfficer" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary/70" /> Oficial Asignado (Sistema)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            readOnly 
                            className="bg-muted/50 font-black uppercase text-primary border-primary/20 pl-10 cursor-not-allowed" 
                            {...field} 
                          />
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Identidad verificada por sesión activa</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="origin" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary/70" /> Origen</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione Entidad" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {originOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="entryDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary/70" /> Fecha</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="entryTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary/70" /> Hora (HH:MM:SS)</FormLabel>
                        <FormControl><Input type="time" step="1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 border-b pb-2"><User className="h-4 w-4" /> Paso 2: Datos de Víctima y Agresor</h3>
                <PersonFormFields 
                  type="victim" 
                  title="Datos de la Víctima" 
                  color="text-primary" 
                  form={form} 
                  validateDni={validateDni} 
                  isValidating={isValidatingDni.victim} 
                />
                <PersonFormFields 
                  type="aggressor" 
                  title="Datos del Agresor" 
                  color="text-destructive" 
                  form={form} 
                  validateDni={validateDni} 
                  isValidating={isValidatingDni.aggressor} 
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Paso 3: Clasificación</h3>
                </div>
                
                <FormField control={form.control} name="violenceType" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> Tipo de Violencia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione el tipo de violencia" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {violenceOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="riskLevel" render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="flex items-center gap-2 font-bold uppercase tracking-tight text-xs text-muted-foreground"><Shield className="h-4 w-4" /> Evaluación del Nivel de Riesgo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                      >
                        {riskOptions.map((opt) => (
                          <FormItem key={opt.value} className="space-y-0">
                            <FormControl>
                              <RadioGroupItem value={opt.value} className="sr-only" />
                            </FormControl>
                            <FormLabel
                              className={cn(
                                "relative flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 h-full text-center overflow-hidden",
                                opt.hover,
                                field.value === opt.value 
                                  ? cn("border-foreground ring-4 ring-offset-2 ring-primary/20 scale-[1.02] shadow-lg", opt.color)
                                  : "border-muted bg-card/50 grayscale-[0.5] opacity-70"
                              )}
                            >
                              {field.value === opt.value && (
                                <div className={cn("absolute top-0 left-0 w-full h-1.5 animate-in slide-in-from-left duration-500", opt.accent)} />
                              )}
                              <span className={cn(
                                "font-extrabold text-xs uppercase mb-2 tracking-widest",
                                field.value === opt.value ? "opacity-100" : "opacity-60"
                              )}>
                                {opt.label}
                              </span>
                              <div className={cn(
                                "w-3 h-3 rounded-full transition-transform duration-300 shadow-inner border-2 border-white",
                                opt.accent,
                                field.value === opt.value ? "scale-150 rotate-12" : "scale-100"
                              )} />
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
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 border-b pb-2">
                  <ClipboardList className="h-4 w-4" /> Paso 4: Detalles adicionales
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="incidentDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary/70" /> Fecha del incidente</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="incidentTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary/70" /> Hora aproximada</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="incidentLocation" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary/70" /> Lugar del incidente</FormLabel>
                    <FormControl><Input placeholder="Especifique el lugar exacto del incidente" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="incidentDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción del incidente</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describa brevemente los hechos reportados..." 
                        className="min-h-[100px] resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="space-y-4">
                  <FormLabel className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Indicaciones de riesgo</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-xl bg-muted/20">
                    {riskFactorOptions.map((option) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="riskFactors"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, option.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== option.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                </div>

                <FormField control={form.control} name="additionalObservations" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones adicionales</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Información adicional relevante para el caso..." 
                        className="min-h-[80px] resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
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
                  <Button type="submit" className="bg-primary hover:bg-primary/90 shadow-xl px-10 h-11 transition-all hover:scale-[1.02]">
                    {isEditing ? <Save className="mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />}
                    {isEditing ? 'ACTUALIZAR DATOS' : 'GUARDAR EN SISTEMA'}
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

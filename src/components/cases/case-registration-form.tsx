"use client"

import React, { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  FilePlus, FileText, Info, Clock, Calendar, Building2, 
  Send, Hash, User, ShieldAlert, 
  ChevronRight, ChevronLeft, Edit3, CheckCircle2, Search, Phone, Map, AlertTriangle, Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addCase } from '@/lib/store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const personSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos'),
  phone: z.string().min(9, 'Mínimo 9 dígitos').max(15),
  street: z.string().min(1, 'Calle requerida'),
  number: z.string().min(1, 'Número requerido'),
  district: z.string().min(1, 'Distrito requerido'),
  reference: z.string().optional(),
});

const caseSchema = z.object({
  caseNumber: z.string().min(1, 'Número de expediente requerido'),
  origin: z.string().min(1, 'Origen requerido'),
  entryDate: z.string().min(1, 'Fecha requerida'),
  entryTime: z.string().min(1, 'Hora requerida'),
  victim: personSchema,
  aggressor: personSchema,
  violenceType: z.string().min(1, 'Tipo de violencia requerido'),
  riskLevel: z.enum(['Leve', 'Moderado', 'Severo', 'Muy Severo']),
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

// Componente extraído fuera para evitar pérdida de foco (Re-renders)
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
}) => (
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
            <FormLabel>DNI</FormLabel>
            <div className="flex gap-2">
              <FormControl><Input placeholder="8 dígitos" maxLength={8} {...field} /></FormControl>
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
            <FormLabel className="flex items-center gap-2"><Phone className="h-3 w-3" /> Celular</FormLabel>
            <FormControl><Input placeholder="999888777" {...field} /></FormControl>
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

export function CaseRegistrationForm({ onCaseAdded }: { onCaseAdded: () => void }) {
  const [step, setStep] = useState(1);
  const [isValidatingDni, setIsValidatingDni] = useState({ victim: false, aggressor: false });
  const { toast } = useToast();

  const getCurrentTimeWithSeconds = () => {
    const now = new Date();
    return now.toLocaleTimeString('es-PE', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const form = useForm<FormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      caseNumber: '',
      origin: '',
      entryDate: new Date().toISOString().split('T')[0],
      entryTime: getCurrentTimeWithSeconds(),
      victim: { name: '', dni: '', phone: '', street: '', number: '', district: 'Paucartambo', reference: '' },
      aggressor: { name: '', dni: '', phone: '', street: '', number: '', district: 'Paucartambo', reference: '' },
      violenceType: '',
      riskLevel: 'Leve',
    },
  });

  const selectedRisk = form.watch('riskLevel');

  const validateDni = async (type: 'victim' | 'aggressor') => {
    const dni = form.getValues(`${type}.dni`);
    if (dni.length !== 8) {
      toast({ variant: "destructive", title: "DNI inválido", description: "Debe tener 8 dígitos." });
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
    if (step === 1) fieldsToValidate = ['caseNumber', 'origin', 'entryDate', 'entryTime'];
    if (step === 2) fieldsToValidate = ['victim', 'aggressor'];
    if (step === 3) fieldsToValidate = ['violenceType', 'riskLevel'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(step + 1);
  };

  const onSubmit = (values: FormData) => {
    addCase({
      ...values,
      status: 'Pendiente',
      tags: [values.violenceType, values.riskLevel],
    });
    
    toast({ title: "Expediente Guardado", description: `Expediente ${values.caseNumber} registrado con éxito.` });
    onCaseAdded();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl border-primary/10 overflow-hidden">
      <CardHeader className="bg-primary py-4">
        <div className="flex justify-between items-center text-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FilePlus className="h-5 w-5" /> Registro de Denuncia Policial
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
                  <FormField control={form.control} name="origin" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary/70" /> Origen</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione Entidad" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {originOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="entryDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary/70" /> Fecha de Ingreso</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="entryTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary/70" /> Hora de Ingreso (HH:MM:SS)</FormLabel>
                      <FormControl><Input type="time" step="1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-xs">
                    El número de expediente se llena manualmente siguiendo el formato <strong>EXP-AÑO-CORRELATIVO</strong>. Asegúrese de verificar el origen del documento antes de continuar.
                  </AlertDescription>
                </Alert>
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
                  <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">Clasificación según Ley N°30364</Badge>
                </div>
                
                <FormField control={form.control} name="violenceType" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> Tipo de Violencia</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    
                    <div className="mt-6 min-h-[100px]">
                      {riskOptions.map((opt) => (
                        selectedRisk === opt.value && (
                          <div key={opt.value} className="animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-500">
                            <Alert className={cn(
                              "border-2 shadow-lg transition-all duration-500", 
                              opt.color
                            )}>
                              <Shield className="h-6 w-6" />
                              <AlertTitle className="text-sm font-bold uppercase tracking-widest mb-1">
                                Estado de Alerta: {opt.label}
                              </AlertTitle>
                              <AlertDescription className="text-sm font-medium leading-relaxed">
                                {opt.desc}
                              </AlertDescription>
                            </Alert>
                          </div>
                        )
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in zoom-in-95 fade-in duration-500">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Paso 4: Resumen Final</h3>
                  <Badge className="bg-green-500 text-white border-none">Listo para Guardar</Badge>
                </div>
                <div className="grid grid-cols-1 gap-6 text-sm">
                  <div className="bg-muted/30 p-5 rounded-xl border border-primary/10 relative group">
                    <Button type="button" variant="ghost" size="sm" className="absolute top-3 right-3 flex items-center gap-1 text-xs text-primary" onClick={() => setStep(1)}><Edit3 className="h-3 w-3" /> Modificar</Button>
                    <h4 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> DATOS DEL EXPEDIENTE</h4>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      <p><strong>Número:</strong> {form.getValues().caseNumber}</p>
                      <p><strong>Origen:</strong> {form.getValues().origin}</p>
                      <p><strong>Fecha:</strong> {form.getValues().entryDate}</p>
                      <p><strong>Hora:</strong> {form.getValues().entryTime}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-5 rounded-xl border border-primary/10 relative group">
                      <Button type="button" variant="ghost" size="sm" className="absolute top-3 right-3 flex items-center gap-1 text-xs text-primary" onClick={() => setStep(2)}><Edit3 className="h-3 w-3" /> Modificar</Button>
                      <h4 className="text-[10px] font-bold text-primary uppercase mb-3 tracking-widest">VÍCTIMA</h4>
                      <p className="font-bold text-base">{form.getValues().victim.name}</p>
                      <p className="text-xs mt-1">DNI: {form.getValues().victim.dni} | Cel: {form.getValues().victim.phone}</p>
                      <p className="text-[10px] text-muted-foreground mt-2 leading-tight">{form.getValues().victim.street} #{form.getValues().victim.number}, {form.getValues().victim.district}</p>
                    </div>
                    <div className="bg-muted/30 p-5 rounded-xl border border-destructive/10 relative group">
                      <Button type="button" variant="ghost" size="sm" className="absolute top-3 right-3 flex items-center gap-1 text-xs text-destructive" onClick={() => setStep(2)}><Edit3 className="h-3 w-3" /> Modificar</Button>
                      <h4 className="text-[10px] font-bold text-destructive uppercase mb-3 tracking-widest">AGRESOR</h4>
                      <p className="font-bold text-base">{form.getValues().aggressor.name}</p>
                      <p className="text-xs mt-1">DNI: {form.getValues().aggressor.dni} | Cel: {form.getValues().aggressor.phone}</p>
                      <p className="text-[10px] text-muted-foreground mt-2 leading-tight">{form.getValues().aggressor.street} #{form.getValues().aggressor.number}, {form.getValues().aggressor.district}</p>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-5 rounded-xl border border-primary/10 relative group">
                    <Button type="button" variant="ghost" size="sm" className="absolute top-3 right-3 flex items-center gap-1 text-xs text-primary" onClick={() => setStep(3)}><Edit3 className="h-3 w-3" /> Modificar</Button>
                    <h4 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">CLASIFICACIÓN Y RIESGO</h4>
                    <div className="flex flex-col gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Tipo:</span>
                        <p className="font-semibold">{form.getValues().violenceType}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Riesgo:</span>
                        <Badge className={cn("text-[10px] uppercase font-bold px-3 py-1", riskOptions.find(o => o.value === form.getValues().riskLevel)?.color)}>
                          {form.getValues().riskLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
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
                    <Send className="mr-2 h-5 w-5" /> GUARDAR EN SISTEMA
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

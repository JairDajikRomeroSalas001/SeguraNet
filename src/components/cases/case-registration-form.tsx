"use client"

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  FilePlus, FileText, Info, Clock, Calendar, Building2, 
  Send, Hash, User, UserMinus, ShieldAlert, MapPin, 
  ChevronRight, ChevronLeft, Edit3, CheckCircle2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addCase } from '@/lib/store';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const caseSchema = z.object({
  // Paso 1
  caseNumber: z.string().min(1, 'Número de expediente requerido'),
  origin: z.string().min(1, 'Origen del documento requerido'),
  entryDate: z.string().min(1, 'Fecha de ingreso requerida'),
  entryTime: z.string().min(1, 'Hora de ingreso requerida'),
  // Paso 2
  victimName: z.string().min(1, 'Nombre de la víctima requerido'),
  victimDni: z.string().min(8, 'DNI debe tener 8 caracteres').max(8),
  aggressorName: z.string().min(1, 'Nombre del agresor requerido'),
  aggressorDni: z.string().optional(),
  // Paso 3
  crimeType: z.string().min(1, 'Tipo de delito requerido'),
  location: z.string().min(1, 'Ubicación requerida'),
  description: z.string().min(10, 'Descripción más detallada requerida'),
  incidentDate: z.string().min(1, 'Fecha del incidente requerida'),
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

export function CaseRegistrationForm({ onCaseAdded }: { onCaseAdded: () => void }) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      caseNumber: '',
      origin: '',
      entryDate: new Date().toISOString().split('T')[0],
      entryTime: new Date().toLocaleTimeString('es-PE', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      victimName: '',
      victimDni: '',
      aggressorName: '',
      aggressorDni: '',
      crimeType: '',
      location: 'Paucartambo',
      description: '',
      incidentDate: new Date().toISOString().split('T')[0],
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 1) fieldsToValidate = ['caseNumber', 'origin', 'entryDate', 'entryTime'];
    if (step === 2) fieldsToValidate = ['victimName', 'victimDni', 'aggressorName'];
    if (step === 3) fieldsToValidate = ['crimeType', 'location', 'description', 'incidentDate'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = (values: FormData) => {
    addCase({
      caseNumber: values.caseNumber,
      origin: values.origin,
      entryDate: values.entryDate,
      entryTime: values.entryTime,
      victimName: values.victimName,
      victimDni: values.victimDni,
      aggressorName: values.aggressorName,
      aggressorDni: values.aggressorDni || 'N/A',
      crimeType: values.crimeType,
      location: values.location,
      description: values.description,
      date: values.incidentDate,
      status: 'Pendiente',
      tags: [values.crimeType, values.origin],
    });
    
    toast({ 
      title: "Expediente Registrado", 
      description: `El expediente ${values.caseNumber} ha sido guardado exitosamente.` 
    });
    onCaseAdded();
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <FileText className="h-4 w-4" /> Paso 1: Datos del Expediente
      </h3>
      <div className="grid grid-cols-1 gap-6">
        <FormField
          control={form.control}
          name="caseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary/70" /> Número de Expediente
              </FormLabel>
              <FormControl>
                <Input placeholder="Ej: EXP-2024-001" className="h-11 font-mono font-bold" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary/70" /> Origen del Documento
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccione la entidad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {originOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="entryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary/70" /> Fecha de Ingreso
                </FormLabel>
                <FormControl>
                  <Input type="date" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="entryTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary/70" /> Hora de Registro
                </FormLabel>
                <FormControl>
                  <Input type="time" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-xs">
          El formato debe ser: <strong>EXP-AÑO-CORRELATIVO</strong>. Verifique el origen del documento.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <User className="h-4 w-4" /> Paso 2: Datos de Víctima y Agresor
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-primary/80 border-b pb-1">DATOS DE LA VÍCTIMA</h4>
          <FormField
            control={form.control}
            name="victimName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl><Input placeholder="Nombres y Apellidos" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="victimDni"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DNI</FormLabel>
                <FormControl><Input placeholder="8 dígitos" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-destructive/80 border-b pb-1">DATOS DEL AGRESOR</h4>
          <FormField
            control={form.control}
            name="aggressorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl><Input placeholder="Nombres y Apellidos" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="aggressorDni"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DNI (Opcional)</FormLabel>
                <FormControl><Input placeholder="Opcional" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <ShieldAlert className="h-4 w-4" /> Paso 3: Clasificación del Incidente
      </h3>
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="crimeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Delito / Falta</FormLabel>
                <FormControl><Input placeholder="Ej: Violencia Familiar" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="incidentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de los Hechos</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary/70" /> Lugar de los Hechos
              </FormLabel>
              <FormControl><Input placeholder="Dirección o referencia" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción Breve de los Hechos</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detalle brevemente lo sucedido..." 
                  className="min-h-[100px] resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderStep4 = () => {
    const values = form.getValues();
    return (
      <div className="space-y-6 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> Paso 4: Resumen de Registro
          </h3>
          <p className="text-[10px] text-muted-foreground italic">Revise los datos antes de finalizar</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Seccion 1 */}
          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 relative group">
            <Button 
              variant="ghost" size="sm" 
              className="absolute top-2 right-2 h-7 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setStep(1)}
            >
              <Edit3 className="h-3 w-3 mr-1" /> MODIFICAR
            </Button>
            <h4 className="text-xs font-bold text-primary mb-2">DATOS DEL EXPEDIENTE</h4>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <p className="text-muted-foreground">Número:</p> <p className="font-mono font-bold">{values.caseNumber}</p>
              <p className="text-muted-foreground">Origen:</p> <p className="font-medium">{values.origin}</p>
              <p className="text-muted-foreground">Ingreso:</p> <p>{values.entryDate} {values.entryTime}</p>
            </div>
          </div>

          {/* Seccion 2 */}
          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 relative group">
            <Button 
              variant="ghost" size="sm" 
              className="absolute top-2 right-2 h-7 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setStep(2)}
            >
              <Edit3 className="h-3 w-3 mr-1" /> MODIFICAR
            </Button>
            <h4 className="text-xs font-bold text-primary mb-2">VÍCTIMA Y AGRESOR</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Víctima</p>
                <p className="font-medium">{values.victimName}</p>
                <p className="text-xs text-muted-foreground">DNI: {values.victimDni}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Agresor</p>
                <p className="font-medium">{values.aggressorName}</p>
                <p className="text-xs text-muted-foreground">DNI: {values.aggressorDni || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Seccion 3 */}
          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 relative group">
            <Button 
              variant="ghost" size="sm" 
              className="absolute top-2 right-2 h-7 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setStep(3)}
            >
              <Edit3 className="h-3 w-3 mr-1" /> MODIFICAR
            </Button>
            <h4 className="text-xs font-bold text-primary mb-2">DETALLE DEL INCIDENTE</h4>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2">
                <p className="text-muted-foreground">Delito:</p> <p className="font-medium">{values.crimeType}</p>
                <p className="text-muted-foreground">Lugar:</p> <p>{values.location}</p>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">Hechos:</p>
              <p className="italic text-xs leading-relaxed line-clamp-2">"{values.description}"</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/10 overflow-hidden">
      <CardHeader className="bg-primary py-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <FilePlus className="h-5 w-5" />
            Registro de Denuncia Policial
          </CardTitle>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 w-6 rounded-full transition-colors ${s <= step ? 'bg-white' : 'bg-white/20'}`} 
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            
            <Separator className="bg-muted" />
            
            <div className="flex justify-between items-center gap-4">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep} className="h-11 px-6">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
              ) : (
                <div />
              )}
              
              {step < 4 ? (
                <Button type="button" onClick={nextStep} className="h-11 px-8 bg-primary">
                  Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="h-11 px-10 bg-green-600 hover:bg-green-700 font-bold">
                  <Send className="mr-2 h-5 w-5" /> GUARDAR EN SISTEMA
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

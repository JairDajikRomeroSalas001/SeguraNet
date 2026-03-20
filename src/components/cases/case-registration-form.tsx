"use client"

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  FilePlus, FileText, Info, Clock, Calendar, Building2, 
  Send, Hash, User, ShieldAlert, MapPin, 
  ChevronRight, ChevronLeft, Edit3, CheckCircle2, Search, Phone, Map
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addCase } from '@/lib/store';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

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
  crimeType: z.string().min(1, 'Tipo de delito requerido'),
  location: z.string().min(1, 'Ubicación requerida'),
  description: z.string().min(10, 'Descripción más detallada requerida'),
  incidentDate: z.string().min(1, 'Fecha requerida'),
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
  const [isValidatingDni, setIsValidatingDni] = useState({ victim: false, aggressor: false });
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      caseNumber: '',
      origin: '',
      entryDate: new Date().toISOString().split('T')[0],
      entryTime: new Date().toLocaleTimeString('es-PE', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      victim: { name: '', dni: '', phone: '', street: '', number: '', district: 'Paucartambo', reference: '' },
      aggressor: { name: '', dni: '', phone: '', street: '', number: '', district: 'Paucartambo', reference: '' },
      crimeType: '',
      location: 'Paucartambo',
      description: '',
      incidentDate: new Date().toISOString().split('T')[0],
    },
  });

  const validateDni = async (type: 'victim' | 'aggressor') => {
    const dni = form.getValues(`${type}.dni`);
    if (dni.length !== 8) {
      toast({ variant: "destructive", title: "DNI inválido", description: "Debe tener 8 dígitos." });
      return;
    }

    setIsValidatingDni(prev => ({ ...prev, [type]: true }));
    
    // Simulación de validación (RENIEC)
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
        toast({ title: "No encontrado", description: "DNI no registrado. Complete manualmente." });
      }
    }, 1000);
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['caseNumber', 'origin', 'entryDate', 'entryTime'];
    if (step === 2) fieldsToValidate = ['victim', 'aggressor'];
    if (step === 3) fieldsToValidate = ['crimeType', 'location', 'description', 'incidentDate'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(step + 1);
  };

  const onSubmit = (values: FormData) => {
    addCase({
      ...values,
      status: 'Pendiente',
      tags: [values.crimeType, values.origin],
      date: values.incidentDate
    });
    
    toast({ title: "Expediente Guardado", description: `Expediente ${values.caseNumber} registrado.` });
    onCaseAdded();
  };

  const PersonFormFields = ({ type, title, color }: { type: 'victim' | 'aggressor', title: string, color: string }) => (
    <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
      <h4 className={`text-xs font-bold ${color} border-b pb-1 uppercase`}>{title}</h4>
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
                  disabled={isValidatingDni[type]}
                >
                  <Search className={`h-4 w-4 ${isValidatingDni[type] ? 'animate-spin' : ''}`} />
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

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl border-primary/10 overflow-hidden">
      <CardHeader className="bg-primary py-4">
        <div className="flex justify-between items-center text-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FilePlus className="h-5 w-5" /> Registro de Denuncia Policial
          </CardTitle>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 w-6 rounded-full transition-colors ${s <= step ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4" /> Paso 1: Datos del Expediente</h3>
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
                      <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione Entidad" /></SelectTrigger></FormControl><SelectContent>{originOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-xs">
                    El número se llena manualmente siguiendo el formato <strong>EXP-AÑO-CORRELATIVO</strong>. Verifique el origen del documento.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> Paso 2: Datos de Víctima y Agresor</h3>
                <PersonFormFields type="victim" title="Datos de la Víctima" color="text-primary" />
                <PersonFormFields type="aggressor" title="Datos del Agresor" color="text-destructive" />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Paso 3: Clasificación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="crimeType" render={({ field }) => (
                    <FormItem><FormLabel>Delito / Falta</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="incidentDate" render={({ field }) => (
                    <FormItem><FormLabel>Fecha del Incidente</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel><MapPin className="h-4 w-4 mr-1 inline" /> Ubicación</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Descripción de los Hechos</FormLabel><FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Paso 4: Resumen</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 relative group">
                    <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => setStep(1)}><Edit3 className="h-3 w-3" /></Button>
                    <h4 className="text-xs font-bold text-primary mb-2">EXPEDIENTE</h4>
                    <p><strong>Número:</strong> {form.getValues().caseNumber}</p>
                    <p><strong>Origen:</strong> {form.getValues().origin}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 relative group">
                    <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => setStep(2)}><Edit3 className="h-3 w-3" /></Button>
                    <div className="grid grid-cols-2 gap-4">
                      <div><h4 className="text-[10px] font-bold text-primary">VÍCTIMA</h4><p>{form.getValues().victim.name} ({form.getValues().victim.dni})</p></div>
                      <div><h4 className="text-[10px] font-bold text-destructive">AGRESOR</h4><p>{form.getValues().aggressor.name} ({form.getValues().aggressor.dni})</p></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <Separator />
            <div className="flex justify-between gap-4">
              {step > 1 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)}><ChevronLeft className="mr-2 h-4 w-4" /> Anterior</Button>}
              <div className="ml-auto flex gap-2">
                {step < 4 ? <Button type="button" onClick={nextStep}>Siguiente <ChevronRight className="ml-2 h-4 w-4" /></Button> : <Button type="submit" className="bg-green-600 hover:bg-green-700"><Send className="mr-2 h-5 w-5" /> GUARDAR EN SISTEMA</Button>}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

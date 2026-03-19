"use client"

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilePlus, FileText, Info, Clock, Calendar, Building2, Send, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addCase, getCases } from '@/lib/store';
import { Alert, AlertDescription } from '@/components/ui/alert';

const caseSchema = z.object({
  caseNumber: z.string().min(1, 'Número de expediente requerido'),
  origin: z.string().min(1, 'Origen del documento requerido'),
  entryDate: z.string().min(1, 'Fecha de ingreso requerida'),
  entryTime: z.string().min(1, 'Hora de ingreso requerida'),
  // Campos por defecto para mantener compatibilidad con la estructura de datos
  complainantName: z.string().default('No especificado'),
  description: z.string().default('Registro de expediente sin descripción detallada'),
  location: z.string().default('Comisaría Paucartambo'),
  date: z.string().default(new Date().toISOString().split('T')[0]),
  crimeType: z.string().default('General'),
});

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
  const { toast } = useToast();

  const generateNextCaseNumber = () => {
    const cases = getCases();
    const nextId = (cases.length + 1).toString();
    const year = new Date().getFullYear();
    return `EXP-${year}-${nextId.padStart(3, '0')}`;
  };

  const form = useForm<z.infer<typeof caseSchema>>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      caseNumber: '',
      origin: '',
      entryDate: new Date().toISOString().split('T')[0],
      entryTime: new Date().toLocaleTimeString('es-PE', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      complainantName: 'No especificado',
      description: 'Registro de expediente sin descripción detallada',
      location: 'Comisaría Paucartambo',
      date: new Date().toISOString().split('T')[0],
      crimeType: 'General',
    },
  });

  useEffect(() => {
    form.setValue('caseNumber', generateNextCaseNumber());
  }, [form]);

  const onSubmit = (values: z.infer<typeof caseSchema>) => {
    addCase({
      ...values,
      status: 'Pendiente',
      tags: ['Expediente'],
    });
    toast({ title: "Expediente Registrado", description: `El expediente ${values.caseNumber} ha sido guardado exitosamente.` });
    form.reset({
      ...form.getValues(),
      caseNumber: generateNextCaseNumber(),
      origin: '',
    });
    onCaseAdded();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md border-primary/10">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2 text-primary">
          <FilePlus className="h-5 w-5" />
          Registro de Datos del Expediente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> Información de Registro
              </h3>
              
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="caseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-primary/70" />
                        Número de Expediente
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="EXP-AÑO-CORRELATIVO" 
                          className="h-11 font-mono font-bold" 
                          {...field} 
                          readOnly 
                        />
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
                        <Building2 className="h-4 w-4 text-primary/70" />
                        Origen del Documento
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Seleccione la entidad de origen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {originOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
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
                          <Calendar className="h-4 w-4 text-primary/70" />
                          Fecha de Ingreso
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
                          <Clock className="h-4 w-4 text-primary/70" />
                          Hora de Registro
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
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-xs leading-relaxed">
                El numero de expediente se genera automaticamnete, siguiendo el formato: <strong>EXP-AÑO-CORRELATIVO</strong>. Asegurese de verificar el origen del documento antes de continuar.
              </AlertDescription>
            </Alert>

            <div className="pt-2">
              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-bold">
                <Send className="mr-2 h-5 w-5" /> Registrar Expediente
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

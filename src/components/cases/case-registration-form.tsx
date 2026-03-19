"use client"

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiIncidentClassifier } from '@/ai/flows/ai-incident-classifier-flow';
import { Loader2, Sparkles, Send, MapPin, Calendar, User, FileText, Info, Clock, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addCase } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const caseSchema = z.object({
  complainantName: z.string().min(3, 'Nombre requerido'),
  description: z.string().min(10, 'Descripción detallada requerida'),
  location: z.string().min(5, 'Ubicación requerida'),
  date: z.string().min(1, 'Fecha requerida'),
  crimeType: z.string().min(1, 'Tipo de delito requerido'),
  origin: z.string().min(1, 'Origen del documento requerido'),
  entryDate: z.string().min(1, 'Fecha de ingreso requerida'),
  entryTime: z.string().min(1, 'Hora de ingreso requerida'),
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
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ crimeClassifications: string[], keyTags: string[] } | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof caseSchema>>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      complainantName: '',
      description: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
      crimeType: '',
      origin: '',
      entryDate: new Date().toISOString().split('T')[0],
      entryTime: new Date().toLocaleTimeString('es-PE', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    },
  });

  const handleAiClassify = async () => {
    const description = form.getValues('description');
    if (description.length < 10) {
      toast({ title: "Error", description: "Ingrese una descripción más detallada para analizar.", variant: "destructive" });
      return;
    }

    setIsClassifying(true);
    try {
      const result = await aiIncidentClassifier({ incidentDescription: description });
      setAiSuggestions(result);
      if (result.crimeClassifications.length > 0) {
        form.setValue('crimeType', result.crimeClassifications[0]);
      }
      toast({ title: "Análisis completado", description: "IA ha sugerido clasificaciones y etiquetas." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo realizar el análisis de IA.", variant: "destructive" });
    } finally {
      setIsClassifying(false);
    }
  };

  const onSubmit = (values: z.infer<typeof caseSchema>) => {
    addCase({
      ...values,
      status: 'Pendiente',
      tags: aiSuggestions?.keyTags || [],
    });
    toast({ title: "Caso Registrado", description: "La denuncia ha sido guardada exitosamente." });
    form.reset();
    setAiSuggestions(null);
    onCaseAdded();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-md border-primary/10">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2 text-primary">
          <FilePlus className="h-5 w-5" />
          Registro de Nueva Denuncia / Expediente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Sección de Datos del Expediente */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> Datos del Expediente
              </h3>
              
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-xs">
                  El número de expediente se genera automáticamente, siguiendo el formato: <strong>EXP-AÑO-CORRELATIVO</strong>. Asegúrese de verificar el origen del documento antes de continuar.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4" />Origen del Documento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione origen" />
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
                <FormField
                  control={form.control}
                  name="entryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha de Ingreso</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entryTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4" />Hora de Ingreso</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <hr className="border-muted" />

            {/* Sección de Datos de la Denuncia */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Detalles del Incidente
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="complainantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" />Nombre del Denunciante</FormLabel>
                      <FormControl><Input placeholder="Nombre completo" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha del Incidente</FormLabel>
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
                    <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" />Ubicación de los Hechos</FormLabel>
                    <FormControl><Input placeholder="Ej: Calle Comercio, Plaza de Armas, etc." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de los Hechos</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea 
                          placeholder="Describa lo sucedido con el mayor detalle posible..." 
                          className="min-h-[120px] pr-12"
                          {...field} 
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="absolute bottom-2 right-2 text-primary hover:text-accent"
                          onClick={handleAiClassify}
                          disabled={isClassifying}
                          title="Analizar con IA"
                        >
                          {isClassifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>Utilice el botón de chispa para obtener sugerencias de clasificación mediante IA.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="crimeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Delito</FormLabel>
                      <FormControl><Input placeholder="Clasificación del delito" {...field} /></FormControl>
                      {aiSuggestions && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {aiSuggestions.crimeClassifications.map((s, i) => (
                            <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => form.setValue('crimeType', s)}>
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {aiSuggestions && (
                  <div className="space-y-2">
                    <FormLabel>Etiquetas Generadas por IA</FormLabel>
                    <div className="flex flex-wrap gap-1">
                      {aiSuggestions.keyTags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="bg-accent/5 text-accent border-accent/20">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-bold">
              <Send className="mr-2 h-5 w-5" /> Registrar Denuncia y Expediente
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Missing imports in original file that might be needed
import { FilePlus, ShieldAlert } from 'lucide-react';

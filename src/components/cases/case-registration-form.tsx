"use client"

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { aiIncidentClassifier } from '@/ai/flows/ai-incident-classifier-flow';
import { Loader2, Sparkles, Send, MapPin, Calendar, User, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addCase } from '@/lib/store';
import { Badge } from '@/components/ui/badge';

const caseSchema = z.object({
  complainantName: z.string().min(3, 'Nombre requerido'),
  description: z.string().min(10, 'Descripción detallada requerida'),
  location: z.string().min(5, 'Ubicación requerida'),
  date: z.string().min(1, 'Fecha requerida'),
  crimeType: z.string().min(1, 'Tipo de delito requerido'),
});

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
    <Card className="w-full max-w-3xl mx-auto shadow-md border-primary/10">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2 text-primary">
          <FileText className="h-5 w-5" />
          Registro de Nueva Denuncia
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" />Ubicación en Paucartambo</FormLabel>
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

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              <Send className="mr-2 h-4 w-4" /> Registrar Denuncia
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
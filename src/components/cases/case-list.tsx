"use client"

import React, { useState } from 'react';
import { PoliceCase, CaseStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, MoreHorizontal, CheckCircle2, Clock, ShieldAlert, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateCaseStatus } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<CaseStatus, { color: string, icon: React.ReactNode }> = {
  'Pendiente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="h-3 w-3" /> },
  'En Proceso': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <ShieldAlert className="h-3 w-3" /> },
  'Resuelto': { color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="h-3 w-3" /> },
  'Cerrado': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <Lock className="h-3 w-3" /> },
};

export function CaseList({ cases, onUpdate }: { cases: PoliceCase[], onUpdate: () => void }) {
  const [selectedCase, setSelectedCase] = useState<PoliceCase | null>(null);
  const [newStatus, setNewStatus] = useState<CaseStatus | null>(null);
  const { toast } = useToast();

  const handleUpdateStatus = () => {
    if (selectedCase && newStatus) {
      updateCaseStatus(selectedCase.id, newStatus);
      toast({ title: "Estado Actualizado", description: `El caso ${selectedCase.caseNumber} ahora está ${newStatus}.` });
      setSelectedCase({ ...selectedCase, status: newStatus });
      onUpdate();
    }
  };

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-dashed border-muted-foreground/25">
        <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-center">No se encontraron denuncias registradas con los criterios seleccionados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="font-bold text-primary">Nro. Caso</TableHead>
              <TableHead className="font-bold text-primary">Denunciante</TableHead>
              <TableHead className="font-bold text-primary">Delito</TableHead>
              <TableHead className="font-bold text-primary">Fecha</TableHead>
              <TableHead className="font-bold text-primary">Estado</TableHead>
              <TableHead className="text-right font-bold text-primary">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => (
              <TableRow key={c.id} className="hover:bg-accent/5 transition-colors">
                <TableCell className="font-mono text-xs font-semibold">{c.caseNumber}</TableCell>
                <TableCell className="font-medium">{c.complainantName}</TableCell>
                <TableCell>{c.crimeType}</TableCell>
                <TableCell>{c.date}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`flex items-center gap-1.5 w-fit ${statusConfig[c.status].color}`}>
                    {statusConfig[c.status].icon}
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCase(c)}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              Detalle del Caso: {selectedCase?.caseNumber}
            </DialogTitle>
            <DialogDescription>
              Información completa y gestión del estado del caso.
            </DialogDescription>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Denunciante</p>
                  <p className="font-semibold text-lg">{selectedCase.complainantName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Fecha de Registro</p>
                  <p>{selectedCase.date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Tipo de Delito</p>
                  <p className="font-medium">{selectedCase.crimeType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Ubicación</p>
                  <p>{selectedCase.location}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground font-medium mb-2">Descripción de los Hechos</p>
                <div className="p-4 bg-muted/30 rounded-md border text-sm leading-relaxed italic">
                  "{selectedCase.description}"
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedCase.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-primary/20">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="pt-4 border-t flex flex-col gap-4">
                <p className="font-semibold text-primary flex items-center gap-2">Actualizar Estado</p>
                <div className="flex gap-4 items-center">
                  <Select 
                    defaultValue={selectedCase.status} 
                    onValueChange={(v) => setNewStatus(v as CaseStatus)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Nuevo Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="En Proceso">En Proceso</SelectItem>
                      <SelectItem value="Resuelto">Resuelto</SelectItem>
                      <SelectItem value="Cerrado">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleUpdateStatus} disabled={!newStatus || newStatus === selectedCase.status}>
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedCase(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
"use client"

import React, { useState } from 'react';
import { PoliceCase, CaseStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, MoreHorizontal, CheckCircle2, Clock, ShieldAlert, Lock, Building2, User, Phone, MapPin } from 'lucide-react';
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
      toast({ title: "Estado Actualizado", description: `Expediente ${selectedCase.caseNumber} actualizado.` });
      onUpdate();
      setSelectedCase(null);
    }
  };

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-dashed">
        <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">No se encontraron denuncias.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="font-bold text-primary">Expediente</TableHead>
              <TableHead className="font-bold text-primary">Víctima</TableHead>
              <TableHead className="font-bold text-primary">Agresor</TableHead>
              <TableHead className="font-bold text-primary">Delito</TableHead>
              <TableHead className="font-bold text-primary">Estado</TableHead>
              <TableHead className="text-right font-bold text-primary">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs font-bold">{c.caseNumber}</TableCell>
                <TableCell className="text-xs">{c.victim.name}</TableCell>
                <TableCell className="text-xs">{c.aggressor.name}</TableCell>
                <TableCell className="text-xs">{c.crimeType}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`flex items-center gap-1.5 w-fit ${statusConfig[c.status].color}`}>
                    {statusConfig[c.status].icon} {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCase(c)}><MoreHorizontal className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <FileText className="h-5 w-5" /> Expediente: {selectedCase?.caseNumber}
            </DialogTitle>
            <DialogDescription>Detalle completo del caso registrado.</DialogDescription>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2"><User className="h-4 w-4" /> DATOS VÍCTIMA</h4>
                  <p className="text-sm"><strong>Nombre:</strong> {selectedCase.victim.name}</p>
                  <p className="text-sm"><strong>DNI:</strong> {selectedCase.victim.dni}</p>
                  <p className="text-sm"><strong>Celular:</strong> {selectedCase.victim.phone}</p>
                  <p className="text-sm"><strong>Dirección:</strong> {selectedCase.victim.street} #{selectedCase.victim.number}, {selectedCase.victim.district}</p>
                </div>
                <div className="space-y-3 p-4 bg-destructive/5 rounded-lg border">
                  <h4 className="text-xs font-bold text-destructive flex items-center gap-2"><User className="h-4 w-4" /> DATOS AGRESOR</h4>
                  <p className="text-sm"><strong>Nombre:</strong> {selectedCase.aggressor.name}</p>
                  <p className="text-sm"><strong>DNI:</strong> {selectedCase.aggressor.dni}</p>
                  <p className="text-sm"><strong>Celular:</strong> {selectedCase.aggressor.phone}</p>
                  <p className="text-sm"><strong>Dirección:</strong> {selectedCase.aggressor.street} #{selectedCase.aggressor.number}, {selectedCase.aggressor.district}</p>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border">
                <h4 className="text-xs font-bold text-primary mb-2">INCIDENTE</h4>
                <p className="text-sm italic">"{selectedCase.description}"</p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <p className="text-sm font-bold">Estado:</p>
                <Select defaultValue={selectedCase.status} onValueChange={(v) => setNewStatus(v as CaseStatus)}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="En Proceso">En Proceso</SelectItem>
                    <SelectItem value="Resuelto">Resuelto</SelectItem>
                    <SelectItem value="Cerrado">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleUpdateStatus}>Actualizar Estado</Button>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="ghost" onClick={() => setSelectedCase(null)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

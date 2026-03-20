"use client"

import React, { useState } from 'react';
import { PoliceCase, CaseStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, MoreHorizontal, CheckCircle2, Clock, ShieldAlert, Lock, User, UserCheck, AlertTriangle, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { updateCaseStatus } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusConfig: Record<CaseStatus, { color: string, icon: React.ReactNode }> = {
  'Pendiente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="h-3 w-3" /> },
  'En Proceso': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <ShieldAlert className="h-3 w-3" /> },
  'Resuelto': { color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="h-3 w-3" /> },
  'Cerrado': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <Lock className="h-3 w-3" /> },
};

const riskColors: Record<string, string> = {
  'Leve': 'bg-green-100 text-green-700 border-green-200',
  'Moderado': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Severo': 'bg-orange-100 text-orange-700 border-orange-200',
  'Muy Severo': 'bg-red-100 text-red-700 border-red-200',
};

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

export function CaseList({ cases, onUpdate }: { cases: PoliceCase[], onUpdate: () => void }) {
  const [selectedCase, setSelectedCase] = useState<PoliceCase | null>(null);
  const [newStatus, setNewStatus] = useState<CaseStatus | null>(null);
  const [showConfirmStatus, setShowConfirmStatus] = useState(false);
  const { toast } = useToast();

  const handleUpdateStatusClick = () => {
    if (newStatus && newStatus !== selectedCase?.status) {
      setShowConfirmStatus(true);
    }
  };

  const confirmUpdateStatus = () => {
    if (selectedCase && newStatus) {
      updateCaseStatus(selectedCase.id, newStatus);
      
      // Cerrar primero el alert y luego el detalle para evitar bloqueos de Radix
      setShowConfirmStatus(false);
      
      setTimeout(() => {
        setSelectedCase(null);
        toast({ 
          title: "Estado Actualizado", 
          description: `Expediente ${selectedCase.caseNumber} actualizado con éxito.` 
        });
        onUpdate();
      }, 100);
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
              <TableHead className="font-bold text-primary">Tipo Violencia</TableHead>
              <TableHead className="font-bold text-primary">Oficial</TableHead>
              <TableHead className="font-bold text-primary">Riesgo</TableHead>
              <TableHead className="font-bold text-primary">Estado</TableHead>
              <TableHead className="font-bold text-primary">Última Act.</TableHead>
              <TableHead className="text-right font-bold text-primary">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs font-bold">{c.caseNumber}</TableCell>
                <TableCell className="text-xs">{c.victim.name}</TableCell>
                <TableCell className="text-xs">{c.aggressor.name}</TableCell>
                <TableCell className="text-xs max-w-[150px] truncate" title={c.violenceType}>{c.violenceType}</TableCell>
                <TableCell className="text-[10px] font-medium uppercase">{c.assignedOfficer || 'Sin asignar'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${riskColors[c.riskLevel]}`}>
                    {c.riskLevel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`flex items-center gap-1.5 w-fit ${statusConfig[c.status].color}`}>
                    {statusConfig[c.status].icon} {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                  <div className="flex flex-col">
                    <span>{format(new Date(c.updatedAt), 'dd/MM/yyyy')}</span>
                    <span className="font-mono">{format(new Date(c.updatedAt), 'HH:mm:ss')}</span>
                  </div>
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
            <DialogDescription>Detalle completo del caso registrado y gestión de estado.</DialogDescription>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest"><User className="h-4 w-4" /> Datos Víctima</h4>
                  <p className="text-sm"><strong>Nombre:</strong> {selectedCase.victim.name}</p>
                  <p className="text-sm"><strong>DNI:</strong> {selectedCase.victim.dni}</p>
                  <p className="text-sm"><strong>Celular:</strong> {selectedCase.victim.phone}</p>
                  <p className="text-sm"><strong>Dirección:</strong> {selectedCase.victim.street} #{selectedCase.victim.number}, {selectedCase.victim.district}</p>
                </div>
                <div className="space-y-3 p-4 bg-destructive/5 rounded-lg border">
                  <h4 className="text-xs font-bold text-destructive flex items-center gap-2 uppercase tracking-widest"><User className="h-4 w-4" /> Datos Agresor</h4>
                  <p className="text-sm"><strong>Nombre:</strong> {selectedCase.aggressor.name}</p>
                  <p className="text-sm"><strong>DNI:</strong> {selectedCase.aggressor.dni}</p>
                  <p className="text-sm"><strong>Celular:</strong> {selectedCase.aggressor.phone}</p>
                  <p className="text-sm"><strong>Dirección:</strong> {selectedCase.aggressor.street} #{selectedCase.aggressor.number}, {selectedCase.aggressor.district}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg border">
                  <h4 className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest flex items-center gap-1.5"><UserCheck className="h-3 w-3" /> Oficial Asignado</h4>
                  <p className="text-sm font-semibold uppercase">{selectedCase.assignedOfficer}</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border">
                  <h4 className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" /> Clasificación</h4>
                  <p className="text-sm font-semibold">{selectedCase.violenceType}</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border">
                  <h4 className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest flex items-center gap-1.5"><History className="h-3 w-3" /> Última Modificación</h4>
                  <p className="text-xs font-mono">{format(new Date(selectedCase.updatedAt), "dd/MM/yyyy 'a las' HH:mm:ss", { locale: es })}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                  <FileText className="h-4 w-4" /> Detalles del Incidente
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/10 p-4 rounded-xl border">
                  <p className="text-sm"><strong>Fecha:</strong> {selectedCase.incidentDate}</p>
                  <p className="text-sm"><strong>Hora:</strong> {selectedCase.incidentTime}</p>
                  <div className="md:col-span-2">
                    <p className="text-sm"><strong>Lugar:</strong> {selectedCase.incidentLocation}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-bold mt-2">Descripción de hechos:</p>
                    <p className="text-sm text-muted-foreground mt-1 bg-white p-3 rounded border italic leading-relaxed">
                      {selectedCase.incidentDescription}
                    </p>
                  </div>
                </div>

                {selectedCase.riskFactors && selectedCase.riskFactors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Factores de Riesgo Detectados:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCase.riskFactors.map(factorId => (
                        <Badge key={factorId} variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          {riskFactorOptions.find(o => o.id === factorId)?.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t bg-muted/5 p-4 rounded-lg">
                <p className="text-sm font-bold">Estado Actual:</p>
                <Select defaultValue={selectedCase.status} onValueChange={(v) => setNewStatus(v as CaseStatus)}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="En Proceso">En Proceso</SelectItem>
                    <SelectItem value="Resuelto">Resuelto</SelectItem>
                    <SelectItem value="Cerrado">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleUpdateStatusClick}>Actualizar Estado</Button>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="ghost" onClick={() => setSelectedCase(null)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmStatus} onOpenChange={setShowConfirmStatus}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de cambiar el estado?</AlertDialogTitle>
            <AlertDialogDescription>
              Usted está por cambiar el estado del expediente <strong>{selectedCase?.caseNumber}</strong> a <strong>"{newStatus}"</strong>. Esta acción quedará registrada con el oficial <strong>{selectedCase?.assignedOfficer}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdateStatus} className="bg-primary hover:bg-primary/90">
              Confirmar Cambio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

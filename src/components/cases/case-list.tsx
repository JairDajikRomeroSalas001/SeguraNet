
"use client"

import React, { useState, useEffect } from 'react';
import { PoliceCase, CaseStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Clock, ShieldAlert, CheckCircle2, Lock, Archive, User, UserCheck, AlertTriangle, History, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useAuth } from '@/components/auth-context';

const statusConfig: Record<CaseStatus, { color: string, icon: React.ReactNode }> = {
  'Pendiente': { color: 'text-yellow-600', icon: <Clock className="h-3 w-3" /> },
  'En Proceso': { color: 'text-blue-600', icon: <ShieldAlert className="h-3 w-3" /> },
  'Resuelto': { color: 'text-green-600', icon: <CheckCircle2 className="h-3 w-3" /> },
  'Cerrado': { color: 'text-gray-600', icon: <Lock className="h-3 w-3" /> },
  'Archivado': { color: 'text-slate-600', icon: <Archive className="h-3 w-3" /> },
};

const riskColors: Record<string, string> = {
  'Leve': 'bg-green-100 text-green-700 border-green-200',
  'Moderado': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Severo': 'bg-orange-100 text-orange-700 border-orange-200',
  'Muy Severo': 'bg-red-100 text-red-700 border-red-200',
};

export function CaseList({ cases, onUpdate }: { cases: PoliceCase[], onUpdate: () => void }) {
  const { user } = useAuth();
  const [viewingCase, setViewingCase] = useState<PoliceCase | null>(null);
  const [changingStatus, setChangingStatus] = useState<{ id: string, caseNumber: string, status: CaseStatus } | null>(null);
  const [passwordVerify, setPasswordVerify] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const cleanup = () => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    };
    
    if (!viewingCase && !changingStatus) {
      const timer = setTimeout(cleanup, 100);
      return () => clearTimeout(timer);
    }
  }, [viewingCase, changingStatus]);

  const handleStatusChangeAttempt = (caseId: string, caseNumber: string, newStatus: CaseStatus) => {
    setChangingStatus({ id: caseId, caseNumber, status: newStatus });
    setPasswordVerify('');
    setPasswordError(false);
  };

  const handleCancelStatusChange = () => {
    setChangingStatus(null);
    setPasswordVerify('');
    setPasswordError(false);
  };

  const confirmStatusChange = () => {
    if (!changingStatus) return;

    // Validación de seguridad: en el demo la contraseña coincide con el nombre de usuario
    if (passwordVerify !== user?.username) {
      setPasswordError(true);
      toast({
        variant: "destructive",
        title: "Error de Seguridad",
        description: "La contraseña ingresada es incorrecta. Acción bloqueada."
      });
      return;
    }

    updateCaseStatus(changingStatus.id, changingStatus.status);
    const caseNum = changingStatus.caseNumber;
    const targetStatus = changingStatus.status;
    
    setChangingStatus(null);
    setPasswordVerify('');
    
    requestAnimationFrame(() => {
      onUpdate();
      toast({ 
        title: "Cambio Autorizado", 
        description: `El expediente ${caseNum} ha sido actualizado a "${targetStatus}" por ${user?.username}.` 
      });
    });
  };

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-dashed">
        <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">No se encontraron denuncias con los filtros aplicados.</p>
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
              <TableHead className="font-bold text-primary">Actualización</TableHead>
              <TableHead className="text-right font-bold text-primary">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs font-bold">{c.caseNumber}</TableCell>
                <TableCell className="text-xs">{c.victim.name}</TableCell>
                <TableCell className="text-xs">{c.aggressor.name}</TableCell>
                <TableCell className="text-xs">{c.violenceType}</TableCell>
                <TableCell className="text-[10px] font-medium uppercase">{c.assignedOfficer}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${riskColors[c.riskLevel]}`}>
                    {c.riskLevel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select 
                    value={c.status} 
                    onValueChange={(val) => handleStatusChangeAttempt(c.id, c.caseNumber, val as CaseStatus)}
                  >
                    <SelectTrigger className={`h-8 w-[140px] text-xs font-bold bg-muted/20 ${statusConfig[c.status].color}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="En Proceso">En Proceso</SelectItem>
                      <SelectItem value="Resuelto">Resuelto</SelectItem>
                      <SelectItem value="Cerrado">Cerrado</SelectItem>
                      <SelectItem value="Archivado">Archivado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                  <div className="flex flex-col">
                    <span>{format(new Date(c.updatedAt), 'dd/MM/yyyy')}</span>
                    <span className="font-mono">{format(new Date(c.updatedAt), 'HH:mm:ss')}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 text-xs font-bold border-primary/20 text-primary hover:bg-primary hover:text-white"
                    onClick={() => setViewingCase(c)}
                  >
                    <Eye className="h-3 w-3" /> VER EXPEDIENTE
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* DIÁLOGO DE DETALLE COMPLETO */}
      <Dialog open={!!viewingCase} onOpenChange={(open) => !open && setViewingCase(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <FileText className="h-5 w-5" /> Expediente: {viewingCase?.caseNumber}
            </DialogTitle>
            <DialogDescription>Información oficial registrada en la base de datos de la Comisaría.</DialogDescription>
          </DialogHeader>

          {viewingCase && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest"><User className="h-4 w-4" /> Datos Víctima</h4>
                  <p className="text-sm"><strong>Nombre:</strong> {viewingCase.victim.name}</p>
                  <p className="text-sm"><strong>DNI:</strong> {viewingCase.victim.dni}</p>
                  <p className="text-sm"><strong>Celular:</strong> {viewingCase.victim.phone}</p>
                  <p className="text-sm"><strong>Dirección:</strong> {viewingCase.victim.street} #{viewingCase.victim.number}, {viewingCase.victim.district}</p>
                </div>
                <div className="space-y-3 p-4 bg-destructive/5 rounded-lg border">
                  <h4 className="text-xs font-bold text-destructive flex items-center gap-2 uppercase tracking-widest"><User className="h-4 w-4" /> Datos Agresor</h4>
                  <p className="text-sm"><strong>Nombre:</strong> {viewingCase.aggressor.name}</p>
                  <p className="text-sm"><strong>DNI:</strong> {viewingCase.aggressor.dni}</p>
                  <p className="text-sm"><strong>Celular:</strong> {viewingCase.aggressor.phone}</p>
                  <p className="text-sm"><strong>Dirección:</strong> {viewingCase.aggressor.street} #{viewingCase.aggressor.number}, {viewingCase.aggressor.district}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg border">
                  <h4 className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest flex items-center gap-1.5"><UserCheck className="h-3 w-3" /> Oficial Responsable</h4>
                  <p className="text-sm font-semibold uppercase">{viewingCase.assignedOfficer}</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border">
                  <h4 className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" /> Clasificación</h4>
                  <p className="text-sm font-semibold">{viewingCase.violenceType}</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border">
                  <h4 className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest flex items-center gap-1.5"><History className="h-3 w-3" /> Última modificación</h4>
                  <p className="text-xs font-mono">{format(new Date(viewingCase.updatedAt), "dd/MM/yyyy HH:mm:ss", { locale: es })}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                  <FileText className="h-4 w-4" /> Hechos Reportados
                </h4>
                <div className="bg-muted/10 p-4 rounded-xl border">
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    {viewingCase.incidentDescription}
                  </p>
                </div>
              </div>
              
              {viewingCase.additionalObservations && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Observaciones</h4>
                  <p className="text-xs p-3 border rounded bg-muted/5">{viewingCase.additionalObservations}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="ghost" onClick={() => setViewingCase(null)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE SEGURIDAD PARA CAMBIO DE ESTADO */}
      <Dialog open={!!changingStatus} onOpenChange={(open) => !open && handleCancelStatusChange()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Autorización de Seguridad
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-bold text-amber-800 uppercase flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" /> ADVERTENCIA DE IRREVOCABILIDAD
                </p>
                <p className="text-[11px] text-amber-700 leading-tight mt-1">
                  Usted está modificando el estado oficial del expediente <strong>{changingStatus?.caseNumber}</strong> a <strong>"{changingStatus?.status}"</strong>. 
                  Esta acción quedará registrada permanentemente en el historial de auditoría y no puede ser deshecha administrativamente.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pass-verify" className="text-xs font-bold uppercase text-muted-foreground">Confirme su Contraseña</Label>
              <Input 
                id="pass-verify"
                type="password" 
                placeholder="Ingrese su contraseña actual"
                className={passwordError ? "border-destructive animate-shake" : ""}
                value={passwordVerify}
                onChange={(e) => setPasswordVerify(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmStatusChange()}
              />
              {passwordError && (
                <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">Contraseña incorrecta</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={handleCancelStatusChange} className="text-xs font-bold uppercase">Cancelar</Button>
            <Button 
              onClick={confirmStatusChange} 
              className="bg-primary hover:bg-primary/90 text-xs font-bold uppercase px-6"
            >
              AUTORIZAR CAMBIO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

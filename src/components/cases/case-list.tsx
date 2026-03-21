"use client"

import React, { useState, useEffect } from 'react';
import { PoliceCase, CaseStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Clock, ShieldAlert, CheckCircle2, Lock, Archive, User, UserCheck, AlertTriangle, History, ShieldCheck, ChevronLeft, ChevronRight, Edit, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateCaseStatus, updateCase } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/components/auth-context';
import { CaseRegistrationForm } from './case-registration-form';

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

const ITEMS_PER_PAGE = 10;

type PasswordPurpose = 'status' | 'edit-entry' | 'edit-save';

export function CaseList({ cases, onUpdate }: { cases: PoliceCase[], onUpdate: () => void }) {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingCase, setViewingCase] = useState<PoliceCase | null>(null);
  
  // Estados para manejo de password y propósitos
  const [passwordPurpose, setPasswordPurpose] = useState<PasswordPurpose | null>(null);
  const [targetStatus, setTargetStatus] = useState<{ id: string, caseNumber: string, status: CaseStatus } | null>(null);
  const [targetEdit, setTargetEdit] = useState<PoliceCase | null>(null);
  const [pendingEditData, setPendingEditData] = useState<PoliceCase | null>(null);
  
  const [isEditingFormOpen, setIsEditingFormOpen] = useState(false);
  const [passwordVerify, setPasswordVerify] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentPage(1);
  }, [cases.length]);

  useEffect(() => {
    const cleanup = () => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    };
    
    if (!viewingCase && !passwordPurpose && !isEditingFormOpen) {
      const timer = setTimeout(cleanup, 100);
      return () => clearTimeout(timer);
    }
  }, [viewingCase, passwordPurpose, isEditingFormOpen]);

  const totalPages = Math.ceil(cases.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCases = cases.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Manejadores para Cambio de Estado
  const handleStatusChangeAttempt = (caseId: string, caseNumber: string, newStatus: CaseStatus) => {
    setTargetStatus({ id: caseId, caseNumber, status: newStatus });
    setPasswordPurpose('status');
    setPasswordVerify('');
    setPasswordError(false);
  };

  // Manejadores para Edición
  const handleEditEntryAttempt = (pCase: PoliceCase) => {
    setTargetEdit(pCase);
    setPasswordPurpose('edit-entry');
    setPasswordVerify('');
    setPasswordError(false);
  };

  const handleEditSaveAttempt = (updatedData: PoliceCase) => {
    setPendingEditData(updatedData);
    setPasswordPurpose('edit-save');
    setPasswordVerify('');
    setPasswordError(false);
  };

  const handleCancelPassword = () => {
    setPasswordPurpose(null);
    setTargetStatus(null);
    setTargetEdit(null);
    setPendingEditData(null);
    setPasswordVerify('');
    setPasswordError(false);
  };

  const confirmAction = () => {
    if (!passwordPurpose) return;

    // Validación simulada con localStorage
    const credsStr = localStorage.getItem('ps_credentials');
    const credentials = credsStr ? JSON.parse(credsStr) : [];
    const currentCred = credentials.find((c: any) => c.username === user?.username);

    if (passwordVerify !== currentCred?.password) {
      setPasswordError(true);
      toast({
        variant: "destructive",
        title: "Error de Seguridad",
        description: "La contraseña ingresada es incorrecta."
      });
      return;
    }

    if (passwordPurpose === 'status' && targetStatus) {
      updateCaseStatus(targetStatus.id, targetStatus.status);
      toast({ title: "Cambio Autorizado", description: "Estado actualizado." });
      onUpdate();
      handleCancelPassword();
    } 
    else if (passwordPurpose === 'edit-entry' && targetEdit) {
      setIsEditingFormOpen(true);
      const dataToEdit = {...targetEdit};
      setTargetEdit(dataToEdit);
      setPasswordPurpose(null); // Cerrar diálogo de password para mostrar form
    }
    else if (passwordPurpose === 'edit-save' && pendingEditData) {
      updateCase(pendingEditData);
      toast({ title: "Edición Exitosa", description: "Expediente actualizado correctamente." });
      setIsEditingFormOpen(false);
      onUpdate();
      handleCancelPassword();
    }
  };

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-dashed">
        <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">No se encontraron denuncias registradas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="font-bold text-primary text-[11px] uppercase tracking-wider">Expediente</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase tracking-wider">Víctima</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase tracking-wider">Agresor</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase tracking-wider">Tipo Violencia</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase tracking-wider">Oficial</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase tracking-wider">Riesgo</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase tracking-wider">Estado</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase tracking-wider">Actualización</TableHead>
              <TableHead className="text-right font-bold text-primary text-[11px] uppercase tracking-wider">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCases.map((c) => (
              <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-[11px] font-bold">{c.caseNumber}</TableCell>
                <TableCell className="text-[11px]">{c.victim.name}</TableCell>
                <TableCell className="text-[11px]">{c.aggressor.name}</TableCell>
                <TableCell className="text-[11px]">{c.violenceType}</TableCell>
                <TableCell className="text-[10px] font-medium uppercase">{c.assignedOfficer}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[9px] font-bold ${riskColors[c.riskLevel]}`}>
                    {c.riskLevel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select 
                    value={c.status} 
                    onValueChange={(val) => handleStatusChangeAttempt(c.id, c.caseNumber, val as CaseStatus)}
                  >
                    <SelectTrigger className={`h-7 w-[130px] text-[10px] font-black bg-muted/20 ${statusConfig[c.status].color} rounded-lg`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente" className="text-xs font-bold">Pendiente</SelectItem>
                      <SelectItem value="En Proceso" className="text-xs font-bold">En Proceso</SelectItem>
                      <SelectItem value="Resuelto" className="text-xs font-bold">Resuelto</SelectItem>
                      <SelectItem value="Cerrado" className="text-xs font-bold">Cerrado</SelectItem>
                      <SelectItem value="Archivado" className="text-xs font-bold">Archivado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                  <div className="flex flex-col">
                    <span>{format(new Date(c.updatedAt), 'dd/MM/yy')}</span>
                    <span className="font-mono text-[9px]">{format(new Date(c.updatedAt), 'HH:mm')}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 gap-1 text-[9px] font-black border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg px-2"
                      onClick={() => setViewingCase(c)}
                    >
                      <Eye className="h-3 w-3" /> VER
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 gap-1 text-[9px] font-black border-amber-500/20 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg px-2"
                      onClick={() => handleEditEntryAttempt(c)}
                    >
                      <Edit className="h-3 w-3" /> EDITAR
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4 bg-white rounded-xl border border-primary/10 shadow-sm">
          <p className="text-[11px] text-muted-foreground font-medium">
            Mostrando <span className="font-bold text-primary">{startIndex + 1}</span> a <span className="font-bold text-primary">{Math.min(startIndex + ITEMS_PER_PAGE, cases.length)}</span> de <span className="font-bold text-primary">{cases.length}</span> resultados
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg border-primary/10 hover:bg-primary/5"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 mx-2">
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-lg text-[11px] font-bold ${currentPage === i + 1 ? 'shadow-md shadow-primary/20' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg border-primary/10 hover:bg-primary/5"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE DETALLE COMPLETO */}
      <Dialog open={!!viewingCase} onOpenChange={(open) => !open && setViewingCase(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2 font-black text-xl">
              <FileText className="h-6 w-6" /> EXPEDIENTE: {viewingCase?.caseNumber}
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Registro Oficial • Comisaría de Paucartambo</DialogDescription>
          </DialogHeader>

          {viewingCase && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-5 bg-muted/20 rounded-2xl border shadow-sm">
                  <h4 className="text-[10px] font-black text-primary flex items-center gap-2 uppercase tracking-[0.2em] border-b pb-2"><User className="h-4 w-4" /> Datos de la Víctima</h4>
                  <div className="space-y-2 pt-1">
                    <p className="text-xs"><strong>NOMBRE:</strong> {viewingCase.victim.name}</p>
                    <p className="text-xs"><strong>DNI:</strong> {viewingCase.victim.dni}</p>
                    <p className="text-xs"><strong>CELULAR:</strong> {viewingCase.victim.phone}</p>
                    <p className="text-xs"><strong>DIRECCIÓN:</strong> {viewingCase.victim.street} #{viewingCase.victim.number}, {viewingCase.victim.district}</p>
                  </div>
                </div>
                <div className="space-y-3 p-5 bg-destructive/5 rounded-2xl border border-destructive/10 shadow-sm">
                  <h4 className="text-[10px] font-black text-destructive flex items-center gap-2 uppercase tracking-[0.2em] border-b border-destructive/10 pb-2"><User className="h-4 w-4" /> Datos del Agresor</h4>
                  <div className="space-y-2 pt-1">
                    <p className="text-xs"><strong>NOMBRE:</strong> {viewingCase.aggressor.name}</p>
                    <p className="text-xs"><strong>DNI:</strong> {viewingCase.aggressor.dni}</p>
                    <p className="text-xs"><strong>CELULAR:</strong> {viewingCase.aggressor.phone}</p>
                    <p className="text-xs"><strong>DIRECCIÓN:</strong> {viewingCase.aggressor.street} #{viewingCase.aggressor.number}, {viewingCase.aggressor.district}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-2xl border shadow-sm flex flex-col items-center text-center">
                  <UserCheck className="h-5 w-5 text-primary mb-2" />
                  <h4 className="text-[9px] font-black text-muted-foreground mb-1 uppercase tracking-widest">Oficial Responsable</h4>
                  <p className="text-xs font-black uppercase text-primary">{viewingCase.assignedOfficer}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border shadow-sm flex flex-col items-center text-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mb-2" />
                  <h4 className="text-[9px] font-black text-muted-foreground mb-1 uppercase tracking-widest">Tipo de Violencia</h4>
                  <p className="text-xs font-black text-primary">{viewingCase.violenceType}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border shadow-sm flex flex-col items-center text-center">
                  <History className="h-5 w-5 text-slate-500 mb-2" />
                  <h4 className="text-[9px] font-black text-muted-foreground mb-1 uppercase tracking-widest">Última Actualización</h4>
                  <p className="text-xs font-mono font-bold text-primary">{format(new Date(viewingCase.updatedAt), "dd/MM/yyyy HH:mm:ss")}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-primary flex items-center gap-2 uppercase tracking-[0.2em]">
                  <FileText className="h-4 w-4" /> Descripción de los Hechos
                </h4>
                <div className="bg-muted/10 p-5 rounded-2xl border italic text-sm leading-relaxed text-slate-700">
                  {viewingCase.incidentDescription}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setViewingCase(null)} className="font-bold text-xs uppercase">Cerrar Expediente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDICIÓN (Formulario) */}
      <Dialog open={isEditingFormOpen} onOpenChange={setIsEditingFormOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          {targetEdit && (
            <CaseRegistrationForm 
              initialData={targetEdit} 
              onCaseAdded={(updatedData) => handleEditSaveAttempt(updatedData)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO ÚNICO DE SEGURIDAD (PASSWORD) */}
      <Dialog open={!!passwordPurpose} onOpenChange={(open) => !open && handleCancelPassword()}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-black text-destructive uppercase tracking-tight">
              {passwordPurpose === 'status' ? 'Autorizar Cambio de Estado' : 
               passwordPurpose === 'edit-entry' ? 'Autorizar Edición de Datos' : 
               'Confirmar Guardado de Edición'}
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-2">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left">
                <p className="text-[10px] font-black text-amber-800 uppercase flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-3 w-3" /> Advertencia Administrativa
                </p>
                <p className="text-[11px] text-amber-700 leading-tight font-medium">
                  {passwordPurpose === 'status' && (
                    <>Va a modificar el estado del expediente <strong className="text-amber-900">{targetStatus?.caseNumber}</strong> a <strong className="text-amber-900">"{targetStatus?.status}"</strong>. Este acto es IRREVOCABLE.</>
                  )}
                  {passwordPurpose === 'edit-entry' && (
                    <>Usted está solicitando acceso al modo de edición del expediente <strong className="text-amber-900">{targetEdit?.caseNumber}</strong>. Toda modificación quedará registrada.</>
                  )}
                  {passwordPurpose === 'edit-save' && (
                    <>Confirmar el guardado final de los cambios realizados en el expediente <strong className="text-amber-900">{pendingEditData?.caseNumber}</strong>. Se requiere firma digital de su cuenta.</>
                  )}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pass-verify" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Confirme su Contraseña Oficial</Label>
              <Input 
                id="pass-verify"
                type="password" 
                placeholder="Ingrese su contraseña"
                className={`h-11 rounded-xl text-center font-bold ${passwordError ? "border-destructive ring-destructive/20" : "border-muted"}`}
                value={passwordVerify}
                onChange={(e) => setPasswordVerify(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmAction()}
              />
              {passwordError && (
                <p className="text-[10px] font-bold text-destructive text-center uppercase tracking-widest">Contraseña incorrecta</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button 
              onClick={confirmAction} 
              className="w-full bg-primary hover:bg-primary/90 h-11 text-xs font-black uppercase tracking-[0.1em] rounded-xl shadow-lg shadow-primary/20"
            >
              VALIDAR Y CONTINUAR
            </Button>
            <Button variant="ghost" onClick={handleCancelPassword} className="w-full text-[10px] font-bold uppercase text-muted-foreground">Cancelar operación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

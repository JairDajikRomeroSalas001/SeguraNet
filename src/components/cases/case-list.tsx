"use client";

import React, { useEffect, useState } from 'react';
import { PoliceCase, CaseStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Clock, ShieldAlert, CheckCircle2, Lock, Archive, User, UserCheck, AlertTriangle, History, ShieldCheck, ChevronLeft, ChevronRight, Edit, Printer, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateCaseStatus, updateCase, deleteCase } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/components/auth-context';
import { CaseRegistrationForm } from './case-registration-form';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Separator } from '@/components/ui/separator';
import { maskDni } from '@/lib/masks';
import { ApiError } from '@/lib/api-client';
import { DocumentManager } from './document-manager';

const statusConfig: Record<CaseStatus, { color: string; icon: React.ReactNode }> = {
  Pendiente: { color: 'text-yellow-600', icon: <Clock className="h-3 w-3" /> },
  'En Proceso': { color: 'text-blue-600', icon: <ShieldAlert className="h-3 w-3" /> },
  Resuelto: { color: 'text-green-600', icon: <CheckCircle2 className="h-3 w-3" /> },
  Cerrado: { color: 'text-gray-600', icon: <Lock className="h-3 w-3" /> },
  Archivado: { color: 'text-slate-600', icon: <Archive className="h-3 w-3" /> },
};

const riskColors: Record<string, string> = {
  Leve: 'bg-green-100 text-green-700 border-green-200',
  Moderado: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Severo: 'bg-orange-100 text-orange-700 border-orange-200',
  'Muy Severo': 'bg-red-100 text-red-700 border-red-200',
};

const ITEMS_PER_PAGE = 10;
type PasswordPurpose = 'status' | 'edit-entry' | 'edit-save' | 'delete';

export function CaseList({ cases, onUpdate }: { cases: PoliceCase[]; onUpdate: () => void }) {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingCase, setViewingCase] = useState<PoliceCase | null>(null);

  const [passwordPurpose, setPasswordPurpose] = useState<PasswordPurpose | null>(null);
  const [targetStatus, setTargetStatus] = useState<{ id: string; caseNumber: string; status: CaseStatus } | null>(null);
  const [targetEdit, setTargetEdit] = useState<PoliceCase | null>(null);
  const [targetDelete, setTargetDelete] = useState<{ id: string; caseNumber: string } | null>(null);
  const [pendingEditData, setPendingEditData] = useState<PoliceCase | null>(null);

  const [isEditingFormOpen, setIsEditingFormOpen] = useState(false);
  const [passwordVerify, setPasswordVerify] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => { setCurrentPage(1); }, [cases.length]);

  const totalPages = Math.ceil(cases.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCases = cases.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const canManageCase = (c: PoliceCase) => {
    if (!user) return false;
    return user.role === 'superadmin' || c.createdByUid === user.uid;
  };

  const cancelPassword = () => {
    setPasswordPurpose(null);
    setTargetStatus(null); setTargetEdit(null); setTargetDelete(null); setPendingEditData(null);
    setPasswordVerify('');
  };

  const confirmAction = async () => {
    if (!passwordPurpose || isProcessing) return;
    setIsProcessing(true);
    try {
      if (passwordPurpose === 'status' && targetStatus) {
        await updateCaseStatus(targetStatus.id, targetStatus.status, passwordVerify);
        toast({ title: 'Estado actualizado', description: targetStatus.caseNumber });
        onUpdate();
        cancelPassword();
      } else if (passwordPurpose === 'edit-entry' && targetEdit) {
        // Verificación: hacemos un PUT no-op para validar la contraseña antes de abrir el editor
        // pero como el PUT ahora valida y aplica, mejor abrimos el editor y validamos en el guardado.
        setIsEditingFormOpen(true);
        setPasswordPurpose(null);
        setPasswordVerify('');
      } else if (passwordPurpose === 'edit-save' && pendingEditData) {
        const { id, ...rest } = pendingEditData;
        await updateCase(id, rest, passwordVerify);
        toast({ title: 'Edición consolidada', description: pendingEditData.caseNumber });
        setIsEditingFormOpen(false);
        onUpdate();
        cancelPassword();
      } else if (passwordPurpose === 'delete' && targetDelete) {
        await deleteCase(targetDelete.id, passwordVerify);
        toast({ title: 'Eliminación lógica', description: targetDelete.caseNumber });
        onUpdate();
        cancelPassword();
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error en la operación';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateIndividualPDF = (c: PoliceCase) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const primary = [54, 71, 125]; const accent = [38, 98, 216]; const destructive = [220, 38, 38];
    const lightGray = [248, 250, 252]; const textColor = [30, 41, 59];

    doc.setFillColor(primary[0], primary[1], primary[2]); doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('POLICÍA NACIONAL DEL PERÚ', 105, 12, { align: 'center' });
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
    doc.text('REGIÓN POLICIAL CUSCO - COMISARÍA PAUCARTAMBO', 105, 17, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text('SISTEMA DE GESTIÓN DE DENUNCIAS "PAUCARTAMBO SEGURA"', 105, 21, { align: 'center' });

    doc.setFillColor(255, 255, 255); doc.roundedRect(65, 25, 80, 5, 1, 1, 'F');
    doc.setTextColor(primary[0], primary[1], primary[2]); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text(`EXPEDIENTE NRO: ${c.caseNumber}`, 105, 28.5, { align: 'center' });

    let y = 42;
    const drawHeader = (title: string, color: number[]) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(14, y, 182, 4.5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), 18, y + 3); y += 6;
    };
    const drawTable = (data: any[][]) => {
      (doc as any).autoTable({
        startY: y, body: data, theme: 'plain',
        styles: { fontSize: 7, cellPadding: 0.8, textColor, font: 'helvetica' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: [0, 0, 0] } },
        margin: { left: 16, right: 16 },
      });
      y = (doc as any).lastAutoTable.finalY + 2.5;
    };

    drawHeader('Información General', primary);
    drawTable([
      ['OFICIAL', c.assignedOfficer], ['ORIGEN', c.origin],
      ['FECHA REGISTRO', format(new Date(c.entryDate), 'dd/MM/yyyy')], ['HORA', c.entryTime], ['ESTADO', c.status.toUpperCase()],
    ]);
    drawHeader('Víctima', accent);
    drawTable([
      ['NOMBRE', c.victim.name], ['DNI', c.victim.dni], ['TELÉFONO', c.victim.phone],
      ['DIRECCIÓN', `${c.victim.street} #${c.victim.number}, ${c.victim.district}`], ['REFERENCIA', c.victim.reference || 'NO REGISTRA'],
    ]);
    drawHeader('Agresor', destructive);
    drawTable([
      ['NOMBRE', c.aggressor.name], ['DNI', c.aggressor.dni], ['TELÉFONO', c.aggressor.phone],
      ['DIRECCIÓN', `${c.aggressor.street} #${c.aggressor.number}, ${c.aggressor.district}`],
    ]);
    drawHeader('Clasificación', primary);
    drawTable([
      ['TIPO VIOLENCIA', c.violenceType], ['RIESGO', c.riskLevel.toUpperCase()],
      ['LUGAR', c.incidentLocation], ['FECHA SUCESO', format(new Date(c.incidentDate), 'dd/MM/yyyy')], ['HORA APROX', c.incidentTime],
    ]);

    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]); doc.roundedRect(14, y, 182, 22, 1, 1, 'F');
    doc.setTextColor(primary[0], primary[1], primary[2]); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPCIÓN DETALLADA:', 18, y + 4);
    doc.setTextColor(60, 60, 60); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    doc.text(doc.splitTextToSize(c.incidentDescription, 174), 18, y + 8);
    y += 26;

    const ph = doc.internal.pageSize.height;
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
    doc.line(70, ph - 40, 140, ph - 40);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('FIRMA Y SELLO DEL OFICIAL', 105, ph - 36, { align: 'center' });
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
    doc.text(c.assignedOfficer, 105, ph - 32, { align: 'center' });

    doc.setFillColor(241, 245, 249); doc.rect(0, ph - 10, 210, 10, 'F');
    doc.setTextColor(148, 163, 184); doc.setFontSize(6);
    doc.text(`Generado ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')} | Paucartambo Segura v3.0`, 105, ph - 6, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text('CODEX CUSCO', 105, ph - 3, { align: 'center' });

    doc.save(`EXPEDIENTE_${c.caseNumber}.pdf`);
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
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Expediente</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Víctima</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Agresor</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Tipo</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Oficial</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Riesgo</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Estado</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Actualización</TableHead>
              <TableHead className="text-right font-bold text-primary text-[11px] uppercase">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCases.map(c => (
              <TableRow key={c.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-[11px] font-bold">{c.caseNumber}</TableCell>
                <TableCell className="text-[11px]">{c.victim.name}</TableCell>
                <TableCell className="text-[11px]">{c.aggressor.name}</TableCell>
                <TableCell className="text-[11px]">{c.violenceType}</TableCell>
                <TableCell className="text-[10px] font-medium uppercase">{c.assignedOfficer}</TableCell>
                <TableCell><Badge variant="outline" className={`text-[9px] font-bold ${riskColors[c.riskLevel]}`}>{c.riskLevel}</Badge></TableCell>
                <TableCell>
                  <Select value={c.status} onValueChange={v => { setTargetStatus({ id: c.id, caseNumber: c.caseNumber, status: v as CaseStatus }); setPasswordPurpose('status'); }} disabled={!canManageCase(c)}>
                    <SelectTrigger className={`h-7 w-[130px] text-[10px] font-black bg-muted/20 ${statusConfig[c.status].color} rounded-lg ${!canManageCase(c) ? 'opacity-50 cursor-not-allowed' : ''}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['Pendiente', 'En Proceso', 'Resuelto', 'Cerrado', 'Archivado'] as CaseStatus[]).map(s => (
                        <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>
                      ))}
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
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[9px] font-black border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg px-2" onClick={() => setViewingCase(c)}><Eye className="h-3 w-3" /> VER</Button>
                    <Button variant="outline" size="sm" disabled={!canManageCase(c)} className="h-7 gap-1 text-[9px] font-black border-amber-500/20 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg px-2 disabled:opacity-30" onClick={() => { setTargetEdit(c); setPasswordPurpose('edit-entry'); }}><Edit className="h-3 w-3" /> EDITAR</Button>
                    <Button variant="outline" size="sm" disabled={!canManageCase(c)} className="h-7 gap-1 text-[9px] font-black border-destructive/20 text-destructive hover:bg-destructive hover:text-white rounded-lg px-2 disabled:opacity-30" onClick={() => { setTargetDelete({ id: c.id, caseNumber: c.caseNumber }); setPasswordPurpose('delete'); }}><Trash2 className="h-3 w-3" /> BORRAR</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4 bg-white rounded-xl border border-primary/10 shadow-sm">
          <p className="text-[11px] text-muted-foreground font-medium">
            Mostrando <span className="font-bold text-primary">{startIndex + 1}</span> a <span className="font-bold text-primary">{Math.min(startIndex + ITEMS_PER_PAGE, cases.length)}</span> de <span className="font-bold text-primary">{cases.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center gap-1 mx-2">
              {[...Array(totalPages)].map((_, i) => (
                <Button key={i} variant={currentPage === i + 1 ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-0 text-[11px] font-bold" onClick={() => setCurrentPage(i + 1)}>{i + 1}</Button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <Dialog open={!!viewingCase} onOpenChange={open => !open && setViewingCase(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="space-y-1">
              <DialogTitle className="text-primary flex items-center gap-2 font-black text-xl"><FileText className="h-6 w-6" /> EXPEDIENTE: {viewingCase?.caseNumber}</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Registro Oficial • Comisaría de Paucartambo</DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-black border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white" onClick={() => viewingCase && generateIndividualPDF(viewingCase)}>
                <Printer className="h-4 w-4" /> IMPRIMIR PDF
              </Button>
            </div>
          </DialogHeader>

          {viewingCase && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-5 bg-muted/20 rounded-2xl border shadow-sm">
                  <h4 className="text-[10px] font-black text-primary flex items-center gap-2 uppercase tracking-[0.2em] border-b pb-2"><User className="h-4 w-4" /> Datos de la Víctima</h4>
                  <div className="space-y-2 pt-1">
                    <p className="text-xs"><strong>NOMBRE:</strong> {viewingCase.victim.name}</p>
                    <p className="text-xs"><strong>DNI:</strong> {maskDni(viewingCase.victim.dni)}</p>
                    <p className="text-xs"><strong>CELULAR:</strong> {viewingCase.victim.phone}</p>
                    <p className="text-xs"><strong>DIRECCIÓN:</strong> {viewingCase.victim.street} #{viewingCase.victim.number}, {viewingCase.victim.district}</p>
                    <p className="text-xs"><strong>REFERENCIA:</strong> {viewingCase.victim.reference || 'Ninguna'}</p>
                  </div>
                </div>
                <div className="space-y-3 p-5 bg-destructive/5 rounded-2xl border border-destructive/10 shadow-sm">
                  <h4 className="text-[10px] font-black text-destructive flex items-center gap-2 uppercase tracking-[0.2em] border-b border-destructive/10 pb-2"><User className="h-4 w-4" /> Datos del Agresor</h4>
                  <div className="space-y-2 pt-1">
                    <p className="text-xs"><strong>NOMBRE:</strong> {viewingCase.aggressor.name}</p>
                    <p className="text-xs"><strong>DNI:</strong> {maskDni(viewingCase.aggressor.dni)}</p>
                    <p className="text-xs"><strong>CELULAR:</strong> {viewingCase.aggressor.phone}</p>
                    <p className="text-xs"><strong>DIRECCIÓN:</strong> {viewingCase.aggressor.street} #{viewingCase.aggressor.number}, {viewingCase.aggressor.district}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-2xl border shadow-sm flex flex-col items-center text-center">
                  <UserCheck className="h-5 w-5 text-primary mb-2" />
                  <h4 className="text-[9px] font-black text-muted-foreground mb-1 uppercase">Oficial</h4>
                  <p className="text-xs font-black uppercase text-primary">{viewingCase.assignedOfficer}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border shadow-sm flex flex-col items-center text-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mb-2" />
                  <h4 className="text-[9px] font-black text-muted-foreground mb-1 uppercase">Tipo</h4>
                  <p className="text-xs font-black text-primary">{viewingCase.violenceType}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border shadow-sm flex flex-col items-center text-center">
                  <Badge variant="outline" className={`text-[10px] font-black mb-1 ${riskColors[viewingCase.riskLevel]}`}>{viewingCase.riskLevel}</Badge>
                  <h4 className="text-[9px] font-black text-muted-foreground uppercase">Riesgo</h4>
                </div>
              </div>

              <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border">
                <h4 className="text-[10px] font-black text-primary flex items-center gap-2 uppercase tracking-[0.2em] mb-2"><History className="h-4 w-4" /> Información del Incidente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                  <p><strong>FECHA:</strong> {format(new Date(viewingCase.incidentDate), 'dd/MM/yyyy')}</p>
                  <p><strong>HORA:</strong> {viewingCase.incidentTime}</p>
                  <p className="md:col-span-2"><strong>LUGAR:</strong> {viewingCase.incidentLocation}</p>
                </div>
                <Separator className="my-3 opacity-50" />
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Descripción:</p>
                  <p className="text-sm italic leading-relaxed text-slate-700">{viewingCase.incidentDescription}</p>
                </div>
              </div>

              <DocumentManager caseId={viewingCase.id} />
            </div>
          )}
          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setViewingCase(null)} className="font-bold text-xs uppercase">Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingFormOpen} onOpenChange={setIsEditingFormOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          {targetEdit && (
            <CaseRegistrationForm
              initialData={targetEdit}
              onCaseAdded={updated => {
                if (updated) {
                  setPendingEditData(updated);
                  setPasswordPurpose('edit-save');
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!passwordPurpose} onOpenChange={open => !open && cancelPassword()}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-black text-destructive uppercase tracking-tight">
              {passwordPurpose === 'status' ? 'Autorizar Cambio de Estado'
                : passwordPurpose === 'edit-entry' ? 'Autorizar Edición'
                : passwordPurpose === 'delete' ? 'Autorizar Eliminación'
                : 'Confirmar Guardado'}
            </DialogTitle>
            <DialogDescription asChild className="space-y-4 pt-2">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left">
                <div className="text-[10px] font-black text-amber-800 uppercase flex items-center gap-2 mb-2"><AlertTriangle className="h-3 w-3" /> Advertencia</div>
                <div className="text-[11px] text-amber-700 leading-tight font-medium">
                  Cada acción queda registrada en auditoría con tu firma.
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pass-verify" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Confirme su contraseña</Label>
              <Input id="pass-verify" type="password" placeholder="Contraseña"
                className="h-11 rounded-xl text-center font-bold border-muted"
                value={passwordVerify} onChange={e => setPasswordVerify(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmAction()} />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={confirmAction} className="w-full bg-primary hover:bg-primary/90 h-11 text-xs font-black uppercase" disabled={isProcessing || !passwordVerify}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'VALIDAR Y CONTINUAR'}
            </Button>
            <Button variant="ghost" onClick={cancelPassword} className="w-full text-[10px] font-bold uppercase text-muted-foreground">Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { PoliceCase, CaseStatus, PersonData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FileText, Eye, Clock, ShieldAlert, CheckCircle2, Lock, Archive, User, UserCheck, AlertTriangle, History, ShieldCheck, ChevronLeft, ChevronRight, Edit, Printer, Trash2, Loader2, EyeOff } from 'lucide-react';
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
import { CaseDeadlineCell } from './case-deadline-cell';

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

const formatAddress = (p: { street?: string; number?: string; district: string; annex?: string; community?: string }) => {
  const parts: string[] = [];
  if (p.street) {
    parts.push(`${p.street}${p.number ? ` #${p.number}` : ''}`);
  }
  if (p.community) {
    parts.push(`Comunidad: ${p.community}`);
  }
  if (p.annex) {
    parts.push(`Anexo: ${p.annex}`);
  }
  parts.push(p.district);
  return parts.join(', ');
};

// Helper: muestra el primer nombre + badge "+N" si hay más
const PersonSummary = ({ persons, color }: { persons: PersonData[]; color: string }) => {
  if (!persons || persons.length === 0) return <span className="text-muted-foreground italic text-[10px]">Sin datos</span>;
  
  const initials = persons[0].name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  
  return (
    <div className="flex items-center gap-2.5">
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border shadow-sm ${color}`}>
        {initials}
      </div>
      <div className="flex flex-col">
        <span className="truncate max-w-[110px] font-bold text-[11px] leading-tight text-foreground">{persons[0].name}</span>
        {persons.length > 1 && (
          <span className="text-[9px] text-muted-foreground font-black tracking-wider mt-0.5">+{persons.length - 1} MÁS</span>
        )}
      </div>
    </div>
  );
};

// Helper: renderiza una tarjeta de persona para el dialog de detalle
const PersonDetailCard = ({
  person, index, total, title, bgClass, borderClass, titleColor,
}: {
  person: PersonData; index: number; total: number; title: string;
  bgClass: string; borderClass: string; titleColor: string;
}) => (
  <div className={`space-y-3 p-5 ${bgClass} rounded-2xl border ${borderClass} shadow-sm`}>
    <h4 className={`text-[10px] font-black ${titleColor} flex items-center gap-2 uppercase tracking-[0.2em] border-b ${borderClass} pb-2`}>
      <User className="h-4 w-4" />
      {title} {total > 1 && <Badge variant="outline" className={`text-[8px] font-black ${titleColor} ml-1`}>{index + 1} de {total}</Badge>}
    </h4>
    <div className="space-y-2 pt-1">
      <p className="text-xs"><strong>NOMBRE:</strong> {person.name}</p>
      <p className="text-xs"><strong>DNI:</strong> {maskDni(person.dni)}</p>
      <p className="text-xs"><strong>CELULAR:</strong> {person.phone}</p>
      <p className="text-xs"><strong>DIRECCIÓN:</strong> {formatAddress(person)}</p>
      {person.annex && <p className="text-xs"><strong>ANEXO:</strong> {person.annex}</p>}
      {person.community && <p className="text-xs"><strong>COMUNIDAD:</strong> {person.community}</p>}
      <p className="text-xs"><strong>REFERENCIA:</strong> {person.reference || 'Ninguna'}</p>
    </div>
  </div>
);

export function CaseList({ cases, onUpdate }: { cases: PoliceCase[]; onUpdate: () => void }) {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingCase, setViewingCase] = useState<PoliceCase | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);

  const [passwordPurpose, setPasswordPurpose] = useState<PasswordPurpose | null>(null);
  const [targetStatus, setTargetStatus] = useState<{ id: string; caseNumber: string; status: CaseStatus } | null>(null);
  const [targetEdit, setTargetEdit] = useState<PoliceCase | null>(null);
  const [targetDelete, setTargetDelete] = useState<{ id: string; caseNumber: string } | null>(null);
  const [pendingEditData, setPendingEditData] = useState<PoliceCase | null>(null);

  const [isEditingFormOpen, setIsEditingFormOpen] = useState(false);
  const [passwordVerify, setPasswordVerify] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const filteredCases = useMemo(() => {
    if (!onlyMine || !user) return cases;
    return cases.filter(c => c.createdByUid === user.uid);
  }, [cases, onlyMine, user]);

  const myCount = useMemo(
    () => (user ? cases.filter(c => c.createdByUid === user.uid).length : 0),
    [cases, user],
  );

  useEffect(() => { setCurrentPage(1); }, [filteredCases.length]);

  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCases = filteredCases.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const canManageCase = (c: PoliceCase) => {
    if (!user) return false;
    return user.role === 'superadmin' || c.createdByUid === user.uid;
  };

  const isOwner = (c: PoliceCase) => !!user && c.createdByUid === user.uid;
  const showOwnershipBadge = user?.role === 'oficial_operativo';

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
      if (y > 260) { doc.addPage(); y = 20; }
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

    // Víctimas (iterar sobre todas)
    c.victims.forEach((v, i) => {
      const label = c.victims.length > 1 ? `Víctima ${i + 1} de ${c.victims.length}` : 'Víctima';
      drawHeader(label, accent);
      drawTable([
        ['NOMBRE', v.name], ['DNI', v.dni], ['TELÉFONO', v.phone],
        ['DIRECCIÓN', formatAddress(v)],
        ...(v.annex ? [['ANEXO', v.annex] as [string, string]] : []),
        ...(v.community ? [['COMUNIDAD', v.community] as [string, string]] : []),
        ['REFERENCIA', v.reference || 'NO REGISTRA'],
      ]);
    });

    // Agresores (iterar sobre todos)
    c.aggressors.forEach((a, i) => {
      const label = c.aggressors.length > 1 ? `Agresor ${i + 1} de ${c.aggressors.length}` : 'Agresor';
      drawHeader(label, destructive);
      drawTable([
        ['NOMBRE', a.name], ['DNI', a.dni], ['TELÉFONO', a.phone],
        ['DIRECCIÓN', formatAddress(a)],
        ...(a.annex ? [['ANEXO', a.annex] as [string, string]] : []),
        ...(a.community ? [['COMUNIDAD', a.community] as [string, string]] : []),
      ]);
    });

    drawHeader('Clasificación', primary);
    drawTable([
      ['TIPO VIOLENCIA', c.violenceType.join(', ')], ['RIESGO', c.riskLevel.toUpperCase()],
      ['LUGAR', c.incidentLocation], ['FECHA SUCESO', format(new Date(c.incidentDate), 'dd/MM/yyyy')], ['HORA APROX', c.incidentTime],
    ]);

    if (y > 250) { doc.addPage(); y = 20; }
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

  const filterBar = user && (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-card rounded-xl border shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {onlyMine ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5" />}
        <span>{onlyMine ? `Mostrando solo míos (${myCount})` : `Mostrando todos (${cases.length})`}</span>
        {!onlyMine && myCount > 0 && (
          <span className="text-[10px] font-medium normal-case tracking-normal text-muted-foreground/70">
            · {myCount} {myCount === 1 ? 'es mío' : 'son míos'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="only-mine" className="text-[10px] font-black uppercase text-muted-foreground cursor-pointer">
          Solo míos
        </Label>
        <Switch id="only-mine" checked={onlyMine} onCheckedChange={setOnlyMine} />
      </div>
    </div>
  );

  if (filteredCases.length === 0) {
    return (
      <div className="space-y-4">
        {filterBar}
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-lg border border-dashed">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {onlyMine ? 'No tienes expedientes propios.' : 'No se encontraron denuncias.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filterBar}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Expediente</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Víctima(s)</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Agresor(es)</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Tipo</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Oficial</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Riesgo</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Tiempo</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Estado</TableHead>
              <TableHead className="font-bold text-primary text-[11px] uppercase">Actualización</TableHead>
              <TableHead className="text-right font-bold text-primary text-[11px] uppercase">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCases.map(c => (
              <TableRow key={c.id} className="hover:bg-muted/30 transition-colors group">
                <TableCell className="font-mono text-[11px] font-bold py-3">
                  <div className="flex flex-col gap-1.5 items-start">
                    <span className="bg-muted px-2 py-1 rounded-md text-foreground">{c.caseNumber}</span>
                    {showOwnershipBadge && (
                      isOwner(c) ? (
                        <Badge className="text-[8px] font-black bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 px-1.5 py-0">MÍO</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[8px] font-black bg-slate-100 text-slate-600 border-slate-200 px-1.5 py-0">SOLO LECTURA</Badge>
                      )
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <PersonSummary persons={c.victims} color="bg-indigo-50 text-indigo-700 border-indigo-200" />
                </TableCell>
                <TableCell>
                  <PersonSummary persons={c.aggressors} color="bg-rose-50 text-rose-700 border-rose-200" />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[120px]">
                    {c.violenceType.map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] font-bold uppercase px-1.5 py-0 bg-slate-100 text-slate-600 hover:bg-slate-200">
                        {t.replace(/Violencia /i, '')}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-black border border-blue-200 shrink-0">
                      {c.assignedOfficer.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold uppercase truncate max-w-[90px]" title={c.assignedOfficer}>
                      {c.assignedOfficer}
                    </span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className={`text-[9px] font-bold ${riskColors[c.riskLevel]}`}>{c.riskLevel}</Badge></TableCell>
                <TableCell><CaseDeadlineCell deadlineAt={c.deadlineAt} status={c.status} /></TableCell>
                <TableCell>
                  <Select value={c.status} onValueChange={v => { setTargetStatus({ id: c.id, caseNumber: c.caseNumber, status: v as CaseStatus }); setPasswordPurpose('status'); }} disabled={!canManageCase(c)}>
                    <SelectTrigger className={`h-8 w-[130px] text-[10px] font-black shadow-none border-0 bg-muted/40 ${statusConfig[c.status].color} rounded-lg ${!canManageCase(c) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/60 transition-colors'}`}>
                      <div className="flex items-center gap-1.5">
                        {statusConfig[c.status].icon}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {(['Pendiente', 'En Proceso', 'Resuelto', 'Cerrado', 'Archivado'] as CaseStatus[]).map(s => (
                        <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">{format(new Date(c.updatedAt), 'dd/MM/yyyy')}</span>
                    <span className="font-mono text-[9px]">{format(new Date(c.updatedAt), 'HH:mm')}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors border border-primary/20 bg-primary/5" title="Ver detalle" onClick={() => setViewingCase(c)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" disabled={!canManageCase(c)} className="h-8 w-8 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition-colors border border-amber-500/20 bg-amber-50 disabled:opacity-30" title="Editar" onClick={() => { setTargetEdit(c); setPasswordPurpose('edit-entry'); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" disabled={!canManageCase(c)} className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-colors border border-destructive/20 bg-destructive/5 disabled:opacity-30" title="Borrar" onClick={() => { setTargetDelete({ id: c.id, caseNumber: c.caseNumber }); setPasswordPurpose('delete'); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4 bg-card rounded-xl border border-primary/10 shadow-sm">
          <p className="text-[11px] text-muted-foreground font-medium">
            Mostrando <span className="font-bold text-primary">{startIndex + 1}</span> a <span className="font-bold text-primary">{Math.min(startIndex + ITEMS_PER_PAGE, filteredCases.length)}</span> de <span className="font-bold text-primary">{filteredCases.length}</span>
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
              {/* ── Víctimas ── */}
              <div className="space-y-3">
                {viewingCase.victims.map((v, i) => (
                  <PersonDetailCard
                    key={`v-${i}`}
                    person={v}
                    index={i}
                    total={viewingCase.victims.length}
                    title="Víctima"
                    bgClass="bg-muted/20"
                    borderClass="border-primary/10"
                    titleColor="text-primary"
                  />
                ))}
              </div>

              {/* ── Agresores ── */}
              <div className="space-y-3">
                {viewingCase.aggressors.map((a, i) => (
                  <PersonDetailCard
                    key={`a-${i}`}
                    person={a}
                    index={i}
                    total={viewingCase.aggressors.length}
                    title="Agresor"
                    bgClass="bg-destructive/5"
                    borderClass="border-destructive/10"
                    titleColor="text-destructive"
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-card rounded-2xl border shadow-sm flex flex-col items-center text-center">
                  <UserCheck className="h-5 w-5 text-primary mb-2" />
                  <h4 className="text-[9px] font-black text-muted-foreground mb-1 uppercase">Oficial</h4>
                  <p className="text-xs font-black uppercase text-primary">{viewingCase.assignedOfficer}</p>
                </div>
                <div className="p-4 bg-card rounded-2xl border shadow-sm flex flex-col items-center text-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mb-2" />
                  <h4 className="text-[9px] font-black text-muted-foreground mb-1 uppercase">Tipo</h4>
                  <p className="text-xs font-black text-primary">{viewingCase.violenceType.join(', ')}</p>
                </div>
                <div className="p-4 bg-card rounded-2xl border shadow-sm flex flex-col items-center text-center">
                  <Badge variant="outline" className={`text-[10px] font-black mb-1 ${riskColors[viewingCase.riskLevel]}`}>{viewingCase.riskLevel}</Badge>
                  <h4 className="text-[9px] font-black text-muted-foreground uppercase">Riesgo</h4>
                </div>
              </div>

              <div className="space-y-3 p-5 bg-muted/30 rounded-2xl border">
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
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-black">Editar expediente</DialogTitle>
          </DialogHeader>
          {targetEdit ? (
            <CaseRegistrationForm
              initialData={targetEdit}
              onCaseAdded={updated => {
                if (updated) {
                  setPendingEditData(updated);
                  setPasswordPurpose('edit-save');
                }
              }}
            />
          ) : (
            <div className="p-6">Cargando...</div>
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

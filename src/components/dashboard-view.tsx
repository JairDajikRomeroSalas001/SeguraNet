
"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaseList } from './cases/case-list';
import { CaseRegistrationForm } from './cases/case-registration-form';
import { CaseSearch, SearchFilters } from './cases/case-search';
import { SettingsView } from './settings-view';
import { getCases } from '@/lib/store';
import { 
  LayoutDashboard, FilePlus, ShieldCheck, LogOut, User as UserIcon, 
  Download, FileText, FileSpreadsheet, Shield, Settings, ChevronDown,
  Globe, Phone, Mail, Facebook, Instagram
} from 'lucide-react';
import { useAuth } from './auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PoliceCase } from '@/lib/types';
import { isWithinInterval, parseISO, startOfDay, endOfDay, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useSessionTimeout } from '@/hooks/use-session-timeout';
import { logAuditEvent } from '@/lib/audit-logger';

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-1.01-.01 2.62-.02 5.24-.02 7.86 0 2.45-1.06 4.96-3.05 6.42-2.15 1.63-5.2 1.95-7.66 1.05-2.61-.95-4.47-3.72-4.41-6.52.06-2.52 1.55-4.99 3.86-6.02 1.25-.56 2.64-.7 3.99-.48.01 1.45.01 2.91.01 4.36-1.07-.34-2.26-.27-3.23.36-.93.61-1.48 1.72-1.4 2.82.08 1.53 1.48 2.84 3 2.81 1.5-.02 2.81-1.32 2.81-2.81V0l-.01.02z"></path>
  </svg>
);

export function DashboardView() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('panel');
  const [allCases, setAllCases] = useState<PoliceCase[]>(getCases());
  const [filteredCases, setFilteredCases] = useState<PoliceCase[]>(getCases());
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
    riskLevel: 'all',
    violenceType: 'all',
    startDate: '',
    endDate: '',
  });

  // Activar cierre de sesión por inactividad (5 minutos conforme a normativa)
  useSessionTimeout();

  const pnpLogo = PlaceHolderImages.find(img => img.id === 'pnp-logo');

  const applyFilters = useCallback((casesToFilter: PoliceCase[], filters: SearchFilters) => {
    let result = [...casesToFilter];

    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(c => 
        c.caseNumber.toLowerCase().includes(q) || 
        c.victim.name.toLowerCase().includes(q)
      );
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }

    if (filters.riskLevel && filters.riskLevel !== 'all') {
      result = result.filter(c => c.riskLevel === filters.riskLevel);
    }

    if (filters.violenceType && filters.violenceType !== 'all') {
      result = result.filter(c => c.violenceType === filters.violenceType);
    }

    if (filters.startDate || filters.endDate) {
      result = result.filter(c => {
        const caseDate = parseISO(c.entryDate);
        const start = filters.startDate ? startOfDay(parseISO(filters.startDate)) : null;
        const end = filters.endDate ? endOfDay(parseISO(filters.endDate)) : null;

        if (start && end) {
          return isWithinInterval(caseDate, { start, end });
        } else if (start) {
          return caseDate >= start;
        } else if (end) {
          return caseDate <= end;
        }
        return true;
      });
    }

    setFilteredCases(result);
  }, []);

  const refreshCases = useCallback(() => {
    const updated = getCases();
    setAllCases(updated);
    applyFilters(updated, activeFilters);
  }, [activeFilters, applyFilters]);

  const handleSearch = useCallback((filters: SearchFilters) => {
    setActiveFilters(filters);
    applyFilters(allCases, filters);
  }, [allCases, applyFilters]);

  const handleExportCSV = () => {
    if (filteredCases.length === 0) {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay denuncias para exportar." });
      return;
    }

    logAuditEvent(user?.username || 'unknown', 'EXPORT_REPORT', `CSV Export of ${filteredCases.length} records`);

    const headers = ["EXPEDIENTE", "OFICIAL", "VICTIMA", "AGRESOR", "TIPO_VIOLENCIA", "RIESGO", "ESTADO", "FECHA"];
    const rows = filteredCases.map(c => [
      `"${c.caseNumber}"`,
      `"${c.assignedOfficer}"`,
      `"${c.victim.name}"`,
      `"${c.aggressor.name}"`,
      `"${c.violenceType}"`,
      `"${c.riskLevel}"`,
      `"${c.status}"`,
      `"${c.entryDate}"`
    ].join(','));

    const csvContent = "\uFEFF" + "sep=,\n" + headers.join(',') + "\n" + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `REPORTE_OFICIAL_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (filteredCases.length === 0) {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay denuncias para exportar." });
      return;
    }

    logAuditEvent(user?.username || 'unknown', 'EXPORT_REPORT', `PDF Export of ${filteredCases.length} records`);

    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.setTextColor(54, 71, 125); 
    doc.text('COMISARIA PNP PAUCARTAMBO - CUSCO', 14, 20);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`REPORTE GENERADO: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')} | OFICIAL: ${user?.username}`, 14, 28);
    
    const tableHeaders = [["EXPEDIENTE", "VÍCTIMA", "AGRESOR", "VIOLENCIA", "RIESGO", "OFICIAL", "ESTADO"]];
    const tableData = filteredCases.map(c => [
      c.caseNumber,
      c.victim.name,
      c.aggressor.name,
      c.violenceType,
      c.riskLevel,
      c.assignedOfficer,
      c.status
    ]);

    (doc as any).autoTable({
      head: tableHeaders,
      body: tableData,
      startY: 34,
      theme: 'grid',
      headStyles: { fillColor: [54, 71, 125], fontStyle: 'bold', fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 2 }
    });

    doc.save(`REPORTE_PDF_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="bg-primary text-primary-foreground py-3 px-8 flex justify-between items-center shadow-lg sticky top-0 z-50 backdrop-blur-md bg-primary/95 h-16">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl w-10 h-10 flex items-center justify-center overflow-hidden">
            {pnpLogo && (
              <Image 
                src={pnpLogo.imageUrl} 
                alt="PNP Logo" 
                width={32} 
                height={32} 
                className="object-contain"
                data-ai-hint={pnpLogo.imageHint}
              />
            )}
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">Paucartambo Segura</h1>
            <p className="text-[9px] text-white/60 uppercase tracking-widest font-bold mt-1">PNP Paucartambo • Oficial</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-11 px-3 hover:bg-white/10 rounded-xl transition-all border border-white/5 gap-3">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-xs font-black uppercase tracking-wider">{user?.username}</span>
                  <span className="text-[9px] text-white/50 font-bold uppercase">Administrador</span>
                </div>
                <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <ChevronDown className="h-3 w-3 text-white/50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-2xl border-primary/10">
              <DropdownMenuLabel className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-3 py-2">Cuenta Oficial</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveTab('configuracion')} className="cursor-pointer gap-3 py-2.5 rounded-lg focus:bg-primary/5 focus:text-primary">
                <Settings className="h-4 w-4" /><span className="font-bold text-[11px] uppercase tracking-wider">Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer gap-3 py-2.5 rounded-lg focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="h-4 w-4" /><span className="font-bold text-[11px] uppercase tracking-wider">Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-6 max-w-7xl animate-in fade-in duration-700">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TabsList className="bg-white border shadow-sm p-1 h-12 rounded-xl">
              <TabsTrigger value="panel" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-10 px-6 rounded-lg font-bold text-xs uppercase tracking-wider">
                <LayoutDashboard className="h-3.5 w-3.5" /> Vista General
              </TabsTrigger>
              <TabsTrigger value="registro" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-10 px-6 rounded-lg font-bold text-xs uppercase tracking-wider">
                <FilePlus className="h-3.5 w-3.5" /> Registrar Denuncia
              </TabsTrigger>
            </TabsList>
            
            {activeTab === 'panel' && (
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-white font-black h-10 px-4 border-primary/10 text-primary text-[10px] uppercase tracking-[0.1em] rounded-lg gap-2 shadow-sm">
                      <Download className="h-3.5 w-3.5" /> Exportar Datos
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl p-1 shadow-xl">
                    <DropdownMenuItem onClick={handleExportCSV} className="gap-3 py-2.5 rounded-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700">
                      <FileSpreadsheet className="h-4 w-4" /><span className="font-bold text-[10px] uppercase">Formato Excel</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF} className="gap-3 py-2.5 rounded-lg cursor-pointer focus:bg-rose-50 focus:text-rose-700">
                      <FileText className="h-4 w-4" /><span className="font-bold text-[10px] uppercase">Formato PDF</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="h-10 flex items-center px-4 bg-white border border-primary/10 rounded-lg shadow-sm">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mr-2">DENUNCIAS</span>
                  <span className="text-lg font-black text-primary leading-none">{filteredCases.length}</span>
                </div>
              </div>
            )}
          </div>

          <TabsContent value="panel" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-6">
              <CaseSearch onSearch={handleSearch} />
              <CaseList cases={filteredCases} onUpdate={refreshCases} />
            </div>
          </TabsContent>

          <TabsContent value="registro" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CaseRegistrationForm onCaseAdded={() => { refreshCases(); setActiveTab('panel'); }} />
          </TabsContent>

          <TabsContent value="configuracion" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SettingsView />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="py-4 px-8 border-t bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted/20 p-1 rounded-lg flex items-center justify-center overflow-hidden">
              {pnpLogo && (
                <Image 
                  src={pnpLogo.imageUrl} 
                  alt="PNP Footer" 
                  width={24} 
                  height={24} 
                  className="object-contain grayscale hover:grayscale-0 transition-all"
                  data-ai-hint={pnpLogo.imageHint}
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-wider text-primary leading-tight">PNP Paucartambo</span>
              <span className="text-[8px] font-bold text-muted-foreground uppercase leading-tight">© {new Date().getFullYear()} Cusco, Perú</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center md:items-end">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[8px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Desarrollado por</span>
                <span className="text-[10px] font-black tracking-widest text-primary uppercase">Codex Cusco</span>
              </div>
              <div className="flex gap-4 text-[9px] font-bold text-muted-foreground/80">
                <a href="https://codexcusco.com" target="_blank" className="hover:text-primary transition-colors">codexcusco.com</a>
                <a href="tel:+51972156954" className="hover:text-primary transition-colors">972 156 954</a>
              </div>
            </div>
            
            <div className="flex gap-2">
              <a href="#" className="p-1.5 bg-muted/10 rounded-lg hover:bg-primary hover:text-white transition-all"><Facebook className="h-3 w-3" /></a>
              <a href="#" className="p-1.5 bg-muted/10 rounded-lg hover:bg-primary hover:text-white transition-all"><Instagram className="h-3 w-3" /></a>
              <a href="#" className="p-1.5 bg-muted/10 rounded-lg hover:bg-primary hover:text-white transition-all"><XIcon className="h-3 w-3" /></a>
              <a href="#" className="p-1.5 bg-muted/10 rounded-lg hover:bg-primary hover:text-white transition-all"><TikTokIcon className="h-3 w-3" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

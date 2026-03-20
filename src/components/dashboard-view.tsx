
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
  Globe, Phone, Mail, Facebook, Instagram, Twitter, Linkedin
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

    const headers = ["EXPEDIENTE", "OFICIAL ASIGNADO", "VÍCTIMA", "AGRESOR", "TIPO VIOLENCIA", "RIESGO", "ESTADO", "FECHA REGISTRO", "LUGAR INCIDENTE"];
    const rows = filteredCases.map(c => [
      `"${c.caseNumber}"`,
      `"${c.assignedOfficer}"`,
      `"${c.victim.name}"`,
      `"${c.aggressor.name}"`,
      `"${c.violenceType}"`,
      `"${c.riskLevel}"`,
      `"${c.status}"`,
      `"${c.entryDate} ${c.entryTime}"`,
      `"${c.incidentLocation}"`
    ].join(','));

    const csvContent = "\uFEFF" + "sep=,\n" + headers.join(',') + "\n" + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Reporte_Paucartambo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Excel Exportado", description: "El reporte se descargó correctamente." });
  };

  const handleExportPDF = () => {
    if (filteredCases.length === 0) {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay denuncias para exportar." });
      return;
    }

    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.setTextColor(54, 71, 125); 
    doc.text('COMISARIA PNP PAUCARTAMBO - CUSCO', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('REPORTE OFICIAL DE DENUNCIAS REGISTRADAS', 14, 28);
    doc.text(`Generado por: ${user?.username} - ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 34);
    
    const tableHeaders = [["EXPEDIENTE", "VÍCTIMA", "AGRESOR", "TIPO VIOLENCIA", "RIESGO", "OFICIAL", "ESTADO"]];
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
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [54, 71, 125], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    doc.save(`Reporte_Oficial_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "PDF Generado", description: "Reporte listo para impresión oficial." });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="bg-primary text-primary-foreground py-4 px-8 flex justify-between items-center shadow-[0_4px_20px_rgba(54,71,125,0.2)] sticky top-0 z-50 backdrop-blur-md bg-primary/95">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="bg-white p-1.5 rounded-xl transition-transform group-hover:scale-110 duration-300 w-12 h-12 flex items-center justify-center overflow-hidden">
            {pnpLogo && (
              <Image 
                src={pnpLogo.imageUrl} 
                alt="PNP Logo" 
                width={40} 
                height={40} 
                className="object-contain"
                data-ai-hint={pnpLogo.imageHint}
              />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Paucartambo Segura
              <Badge variant="outline" className="text-[9px] border-white/20 text-white/80 font-bold tracking-[0.2em] px-2 py-0">OFICIAL</Badge>
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-white/60 uppercase tracking-widest font-bold">
              <Shield className="h-3 w-3" />
              PNP Paucartambo • Ministerio del Interior
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-4 py-6 hover:bg-white/10 rounded-xl transition-all border border-white/5">
                <div className="hidden lg:flex flex-col items-end text-right">
                  <span className="text-sm font-bold tracking-tight">{user?.username}</span>
                  <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Oficial Administrativo</span>
                </div>
                <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <ChevronDown className="h-4 w-4 text-white/50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-2xl border-primary/10">
              <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-3 py-2">
                Mi Perfil Oficial
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setActiveTab('configuracion')}
                className="cursor-pointer gap-3 py-3 rounded-lg focus:bg-primary/5 focus:text-primary transition-colors"
              >
                <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                  <Settings className="h-4 w-4" />
                </div>
                <span className="font-bold text-xs uppercase tracking-wider">Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout}
                className="cursor-pointer gap-3 py-3 rounded-lg focus:bg-destructive/10 focus:text-destructive transition-colors"
              >
                <div className="p-1.5 bg-destructive/10 rounded-md text-destructive">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="font-bold text-xs uppercase tracking-wider">Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-10 px-6 max-w-7xl animate-in fade-in duration-700">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <TabsList className="bg-white border shadow-sm p-1.5 h-14 rounded-2xl w-full md:w-auto overflow-x-auto">
              <TabsTrigger 
                value="panel" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-6 rounded-xl font-bold transition-all whitespace-nowrap"
              >
                <LayoutDashboard className="h-4 w-4" /> VISTA GENERAL
              </TabsTrigger>
              <TabsTrigger 
                value="registro" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-6 rounded-xl font-bold transition-all whitespace-nowrap"
              >
                <FilePlus className="h-4 w-4" /> REGISTRAR DENUNCIA
              </TabsTrigger>
            </TabsList>
            
            {activeTab === 'panel' && (
              <div className="flex items-center gap-4 w-full md:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-white font-bold h-12 px-6 border-primary/10 text-primary hover:bg-primary/5 transition-all shadow-sm rounded-2xl gap-2">
                      <Download className="h-4 w-4" /> EXPORTAR
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-xl p-2 shadow-xl border-primary/10">
                    <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer gap-3 py-3 rounded-lg focus:bg-emerald-50 focus:text-emerald-700">
                      <div className="p-1.5 bg-emerald-100 rounded-md"><FileSpreadsheet className="h-4 w-4" /></div>
                      <span className="font-bold text-xs uppercase tracking-wider">Exportar a Excel</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer gap-3 py-3 rounded-lg focus:bg-rose-50 focus:text-rose-700">
                      <div className="p-1.5 bg-rose-100 rounded-md"><FileText className="h-4 w-4" /></div>
                      <span className="font-bold text-xs uppercase tracking-wider">Reporte PDF Oficial</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-12 flex items-center px-6 bg-white border border-primary/10 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-3">TOTAL</span>
                  <span className="text-xl font-black text-primary">{filteredCases.length}</span>
                </div>
              </div>
            )}
          </div>

          <TabsContent value="panel" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <CaseSearch onSearch={handleSearch} />
              <CaseList cases={filteredCases} onUpdate={refreshCases} />
            </div>
          </TabsContent>

          <TabsContent value="registro" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CaseRegistrationForm onCaseAdded={() => { refreshCases(); setActiveTab('panel'); }} />
          </TabsContent>

          <TabsContent value="configuracion" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingsView />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="py-16 px-8 border-t bg-white">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4 group">
              <div className="w-16 h-16 bg-muted/20 p-2 rounded-2xl grayscale group-hover:grayscale-0 transition-all duration-500 overflow-hidden flex items-center justify-center">
                {pnpLogo && (
                  <Image 
                    src={pnpLogo.imageUrl} 
                    alt="PNP Footer" 
                    width={50} 
                    height={50} 
                    className="object-contain"
                    data-ai-hint={pnpLogo.imageHint}
                  />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Sistema Oficial de Seguridad</span>
                <span className="text-xs font-bold text-muted-foreground">República del Perú • PNP Paucartambo © {new Date().getFullYear()}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <a href="#" className="p-3 bg-muted/10 rounded-full hover:bg-primary hover:text-white transition-all shadow-sm">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-3 bg-muted/10 rounded-full hover:bg-primary hover:text-white transition-all shadow-sm">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-3 bg-muted/10 rounded-full hover:bg-primary hover:text-white transition-all shadow-sm">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-3 bg-muted/10 rounded-full hover:bg-primary hover:text-white transition-all shadow-sm">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <Separator className="opacity-20" />
          
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary font-bold tracking-tight">
                <span className="text-xs uppercase tracking-[0.3em] opacity-40">Desarrollado con excelencia por</span>
                <span className="text-lg font-black tracking-widest text-primary">CODEX CUSCO</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl">
              <a href="https://codexcusco.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-primary/5 transition-all group">
                <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Globe className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">codexcusco.com</span>
              </a>
              
              <a href="tel:+51972156954" className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-primary/5 transition-all group">
                <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Phone className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">972 156 954</span>
              </a>
              
              <a href="mailto:CODEXCUSCO@GMAIL.COM" className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-primary/5 transition-all group">
                <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Mail className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-wrap break-all px-2">CODEXCUSCO@GMAIL.COM</span>
              </a>
            </div>
          </div>

          <div className="pt-4 text-center">
             <p className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-[0.5em]">
               Innovación Digital al Servicio de la Ciudadanía
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

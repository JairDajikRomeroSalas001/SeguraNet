"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaseList } from './cases/case-list';
import { CaseRegistrationForm } from './cases/case-registration-form';
import { CaseSearch, SearchFilters } from './cases/case-search';
import { SettingsView } from './settings-view';
import { getCases } from '@/lib/store';
import { LayoutDashboard, FilePlus, ShieldCheck, LogOut, User as UserIcon, Download, FileText, FileSpreadsheet, Shield, Settings } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
          <div className="bg-white/10 p-2.5 rounded-2xl transition-transform group-hover:scale-110 duration-300">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Paucartambo Segura
              <Badge variant="outline" className="text-[9px] border-white/20 text-white/80 font-bold tracking-[0.2em] px-2 py-0">OFICIAL</Badge>
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-white/60 uppercase tracking-widest font-bold">
              <Shield className="h-3 w-3" />
              Ministerio del Interior • PNP Paucartambo
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end border-r border-white/10 pr-6">
            <span className="text-sm font-bold tracking-tight">{user?.username}</span>
            <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Oficial Administrativo</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout} 
            className="hover:bg-destructive/20 hover:text-white transition-all gap-2 font-bold px-4 rounded-xl border border-white/10"
          >
            <LogOut className="h-4 w-4" /> 
            <span className="hidden sm:inline">SALIR</span>
          </Button>
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
              <TabsTrigger 
                value="configuracion" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-6 rounded-xl font-bold transition-all whitespace-nowrap"
              >
                <Settings className="h-4 w-4" /> CONFIGURACIÓN
              </TabsTrigger>
            </TabsList>
            
            {activeTab !== 'configuracion' && (
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

      <footer className="py-8 px-8 border-t bg-white text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">SISTEMA DE SEGURIDAD PAUCARTAMBO</span>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em]">
            República del Perú • Ministerio del Interior • Comisaría PNP Paucartambo © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

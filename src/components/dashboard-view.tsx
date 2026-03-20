"use client"

import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaseList } from './cases/case-list';
import { CaseRegistrationForm } from './cases/case-registration-form';
import { CaseSearch, SearchFilters } from './cases/case-search';
import { getCases } from '@/lib/store';
import { LayoutDashboard, FilePlus, Search, ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from './auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PoliceCase } from '@/lib/types';
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';

export function DashboardView() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('panel');
  const [allCases, setAllCases] = useState<PoliceCase[]>(getCases());
  const [filteredCases, setFilteredCases] = useState<PoliceCase[]>(getCases());

  const refreshCases = useCallback(() => {
    const updated = getCases();
    setAllCases(updated);
    setFilteredCases(updated);
  }, []);

  const handleSearch = useCallback((filters: SearchFilters) => {
    let result = [...allCases];

    // Filtro por texto (Expediente o Víctima)
    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(c => 
        c.caseNumber.toLowerCase().includes(q) || 
        c.victim.name.toLowerCase().includes(q)
      );
    }

    // Filtro por Estado
    if (filters.status && filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }

    // Filtro por Nivel de Riesgo
    if (filters.riskLevel && filters.riskLevel !== 'all') {
      result = result.filter(c => c.riskLevel === filters.riskLevel);
    }

    // Filtro por Tipo de Violencia
    if (filters.violenceType && filters.violenceType !== 'all') {
      result = result.filter(c => c.violenceType === filters.violenceType);
    }

    // Filtro por Rango de Fechas
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
  }, [allCases]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-full"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Paucartambo Segura</h1>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">Comisaría de Paucartambo - Cusco</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-semibold">{user?.username}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-80">Oficial Administrativo</span>
          </div>
          <div className="bg-white/10 p-2 rounded-full"><UserIcon className="h-5 w-5" /></div>
          <Button variant="ghost" size="icon" onClick={logout} className="hover:bg-white/10 ml-2">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-8 px-4 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <TabsList className="bg-white border shadow-sm p-1 h-12">
              <TabsTrigger value="panel" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-10 px-6 font-bold">
                <LayoutDashboard className="h-4 w-4" /> VISTA GENERAL
              </TabsTrigger>
              <TabsTrigger value="registro" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white h-10 px-6 font-bold">
                <FilePlus className="h-4 w-4" /> NUEVA DENUNCIA
              </TabsTrigger>
            </TabsList>
            <Badge variant="outline" className="bg-white border-primary/20 text-primary py-1.5 px-4 font-bold">
              {filteredCases.length} EXPEDIENTES ENCONTRADOS
            </Badge>
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
        </Tabs>
      </main>

      <footer className="py-6 px-6 border-t bg-white text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
        República del Perú - Ministerio del Interior - Comisaría Paucartambo © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

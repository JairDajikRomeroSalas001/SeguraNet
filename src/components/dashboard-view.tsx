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

    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(c => 
        c.caseNumber.toLowerCase().includes(q) || 
        c.complainantName.toLowerCase().includes(q)
      );
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }

    if (filters.type) {
      result = result.filter(c => c.crimeType.toLowerCase().includes(filters.type.toLowerCase()));
    }

    if (filters.date) {
      result = result.filter(c => c.date === filters.date);
    }

    setFilteredCases(result);
  }, [allCases]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-full">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Paucartambo Segura</h1>
            <p className="text-xs text-white/70">Comisaría de Paucartambo - Cusco</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-semibold">{user?.username}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-80">Administrador</span>
          </div>
          <UserIcon className="h-5 w-5 opacity-80" />
          <Button variant="ghost" size="icon" onClick={logout} className="hover:bg-white/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 px-4 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="flex justify-center md:justify-start mb-2">
            <TabsList className="bg-white/50 border shadow-sm">
              <TabsTrigger value="panel" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <LayoutDashboard className="h-4 w-4" />
                Panel de Casos
              </TabsTrigger>
              <TabsTrigger value="registro" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <FilePlus className="h-4 w-4" />
                Registro de Casos
              </TabsTrigger>
              <TabsTrigger value="busqueda" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Search className="h-4 w-4" />
                Búsqueda Avanzada
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="panel" className="mt-0 outline-none">
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-primary">Vista General de Denuncias</h2>
                <Badge variant="outline" className="bg-white">{allCases.length} Casos en total</Badge>
              </div>
              <CaseList cases={allCases} onUpdate={refreshCases} />
            </div>
          </TabsContent>

          <TabsContent value="registro" className="mt-0 outline-none">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CaseRegistrationForm onCaseAdded={() => { setActiveTab('panel'); refreshCases(); }} />
            </div>
          </TabsContent>

          <TabsContent value="busqueda" className="mt-0 outline-none">
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-2xl font-bold text-primary">Localizar Denuncias</h2>
              <CaseSearch onSearch={handleSearch} />
              <div className="bg-white/50 p-2 rounded-lg border border-dashed text-center mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Resultados del Filtro</p>
              </div>
              <CaseList cases={filteredCases} onUpdate={refreshCases} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t bg-white text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Paucartambo Segura - Sistema de Gestión de Denuncias Policiales.
      </footer>
    </div>
  );
}

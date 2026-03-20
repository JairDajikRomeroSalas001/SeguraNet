"use client"

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar, X, ShieldAlert, AlertTriangle, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface SearchFilters {
  query: string;
  status: string;
  riskLevel: string;
  violenceType: string;
  startDate: string;
  endDate: string;
}

const violenceOptions = [
  "Violencia física",
  "Violencia Psicológica",
  "Violencia económica",
  "Violencia sexual",
  "Violencia patrimonial",
  "Violencia mixta"
];

const riskOptions = [
  "Leve",
  "Moderado",
  "Severo",
  "Muy Severo"
];

export function CaseSearch({ onSearch }: { onSearch: (filters: SearchFilters) => void }) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
    riskLevel: 'all',
    violenceType: 'all',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  const clearFilters = () => {
    setFilters({
      query: '',
      status: 'all',
      riskLevel: 'all',
      violenceType: 'all',
      startDate: '',
      endDate: '',
    });
  };

  return (
    <Card className="mb-6 border-primary/10 shadow-sm bg-muted/5">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de expediente o nombre de la víctima..."
              className="pl-10 bg-white"
              value={filters.query}
              onChange={(e) => setFilters(f => ({ ...f, query: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Filter className="h-3 w-3" /> Estado
              </label>
              <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="En Proceso">En Proceso</SelectItem>
                  <SelectItem value="Resuelto">Resuelto</SelectItem>
                  <SelectItem value="Cerrado">Cerrado</SelectItem>
                  <SelectItem value="Archivado">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Riesgo
              </label>
              <Select value={filters.riskLevel} onValueChange={(v) => setFilters(f => ({ ...f, riskLevel: v }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Nivel de Riesgo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {riskOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Violencia
              </label>
              <Select value={filters.violenceType} onValueChange={(v) => setFilters(f => ({ ...f, violenceType: v }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Tipo de Violencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {violenceOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Desde
              </label>
              <Input
                type="date"
                className="bg-white"
                value={filters.startDate}
                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Hasta
              </label>
              <Input
                type="date"
                className="bg-white"
                value={filters.endDate}
                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full text-muted-foreground hover:text-destructive hover:border-destructive transition-colors bg-white"
                onClick={clearFilters}
              >
                <X className="mr-2 h-3 w-3" /> Limpiar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

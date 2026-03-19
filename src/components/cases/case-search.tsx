"use client"

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface SearchFilters {
  query: string;
  status: string;
  type: string;
  date: string;
}

export function CaseSearch({ onSearch }: { onSearch: (filters: SearchFilters) => void }) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
    type: '',
    date: '',
  });

  useEffect(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  const clearFilters = () => {
    setFilters({
      query: '',
      status: 'all',
      type: '',
      date: '',
    });
  };

  return (
    <Card className="mb-6 border-primary/10 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de caso o nombre de denunciante..."
              className="pl-10"
              value={filters.query}
              onChange={(e) => setFilters(f => ({ ...f, query: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> Estado
              </label>
              <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="En Proceso">En Proceso</SelectItem>
                  <SelectItem value="Resuelto">Resuelto</SelectItem>
                  <SelectItem value="Cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Fecha
              </label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                Tipo
              </label>
              <Input
                placeholder="Tipo de delito..."
                value={filters.type}
                onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full text-muted-foreground hover:text-destructive"
                onClick={clearFilters}
              >
                <X className="mr-2 h-4 w-4" /> Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
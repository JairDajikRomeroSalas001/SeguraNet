"use client";

import React, { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { File as FileIcon, Upload, Download, Trash2, Loader2, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import type { CaseDocument } from '@/lib/types';

interface UploadResponse {
  docId: string;
  uploadEndpoint: string;
  storagePath: string;
  expectedMimeType: string;
  expectedSizeBytes: number;
}

export function DocumentManager({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<CaseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('Anexo');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const reload = async () => {
    setIsLoading(true);
    try {
      const { documents } = await api.get<{ documents: CaseDocument[] }>(`/api/cases/${caseId}/documents`);
      setDocs(documents);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al listar documentos';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { reload(); }, [caseId]);

  const handleUpload = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'Sin archivo', description: 'Seleccione un PDF/JPG/PNG.' });
      return;
    }
    setIsUploading(true);
    try {
      const init = await api.post<UploadResponse>(`/api/cases/${caseId}/documents/request-upload`, {
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        documentType: docType,
        description,
      });
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(init.uploadEndpoint, { method: 'POST', body: fd, credentials: 'same-origin' });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }
      toast({ title: 'Documento subido', description: file.name });
      setFile(null); setDescription('');
      await reload();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (err as Error).message;
      toast({ variant: 'destructive', title: 'Error de subida', description: msg });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: CaseDocument) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/documents/${doc.id}/download`, { credentials: 'same-origin' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: (err as Error).message });
    }
  };

  const handleDelete = async (doc: CaseDocument) => {
    if (!confirm(`¿Eliminar "${doc.filename}"?`)) return;
    try {
      await api.delete(`/api/cases/${caseId}/documents/${doc.id}`);
      toast({ title: 'Documento eliminado' });
      await reload();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al eliminar';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    }
  };

  return (
    <div className="space-y-4 p-5 bg-muted/20 rounded-2xl border">
      <h4 className="text-[10px] font-black text-primary flex items-center gap-2 uppercase tracking-[0.2em] border-b pb-2">
        <Paperclip className="h-4 w-4" /> Documentos Adjuntos
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2">
          <Label className="text-[10px] font-black uppercase text-muted-foreground">Archivo (PDF/JPG/PNG, máx. 50MB)</Label>
          <Input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase text-muted-foreground">Tipo</Label>
          <Input value={docType} onChange={e => setDocType(e.target.value)} placeholder="Anexo / Acta" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-[10px] font-black uppercase text-muted-foreground">Descripción (opcional)</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <Button onClick={handleUpload} disabled={!file || isUploading} className="h-10 gap-2">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Subir
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-4"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
        ) : docs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Sin documentos adjuntos</p>
        ) : (
          docs.map(d => (
            <div key={d.id} className="flex items-center justify-between bg-card p-3 rounded-lg border">
              <div className="flex items-center gap-3 min-w-0">
                <FileIcon className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{d.filename}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {d.documentType} • {(d.sizeBytes / 1024).toFixed(1)} KB • {format(new Date(d.uploadedAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => handleDownload(d)} className="h-8 gap-1 text-[10px]">
                  <Download className="h-3 w-3" /> DESCARGAR
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(d)} className="h-8 gap-1 text-[10px] text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

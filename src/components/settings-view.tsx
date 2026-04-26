"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Lock, Save, ShieldCheck, Key, Database, Download, ShieldAlert, BadgeCheck, Fingerprint } from 'lucide-react';
import { getCases } from '@/lib/store';
import { logAuditEvent } from '@/lib/audit-logger';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { decryptData } from '@/lib/crypto';

export function SettingsView() {
  const { user, updateCredentials } = useAuth();
  const { toast } = useToast();
  
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newDni, setNewDni] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
      setNewFullName(user.fullName);
      setNewDni(user.dni);
    }
  }, [user]);

  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupError, setBackupError] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const encryptedCreds = localStorage.getItem('ps_credentials_enc');
    const credentials = encryptedCreds ? await decryptData(encryptedCreds) : [];
    const currentCred = credentials.find((c: any) => c.username === user?.username);

    if (currentPassword !== currentCred?.password) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "La contraseña actual es incorrecta."
      });
      return;
    }

    if (newDni.length !== 8) {
      toast({ variant: "destructive", title: "DNI inválido", description: "El DNI debe tener 8 dígitos." });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Las contraseñas no coinciden." });
      return;
    }

    setIsUpdating(true);
    await updateCredentials(newUsername, newPassword || currentPassword, newFullName, newDni);
    setIsUpdating(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    toast({ title: "Perfil Actualizado", description: "Cambios guardados exitosamente." });
  };

  const confirmBackup = async () => {
    const encryptedCreds = localStorage.getItem('ps_credentials_enc');
    const credentials = encryptedCreds ? await decryptData(encryptedCreds) : [];
    const currentCred = credentials.find((c: any) => c.username === user?.username);

    if (backupPassword !== currentCred?.password) {
      setBackupError(true);
      return;
    }

    const cases = getCases(true); 
    const logs = JSON.parse(localStorage.getItem('ps_audit_logs') || '[]');
    
    const backupData = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      officer: user?.fullName,
      data: { expedientes: cases, auditoria: logs }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BACKUP_SEGURANET_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
    link.click();

    logAuditEvent(user?.username || 'unknown', 'SYSTEM_BACKUP', 'Copia de seguridad generada');
    setIsBackupDialogOpen(false);
    toast({ title: "Respaldo Listo", description: "Archivo descargado." });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Card className="shadow-xl border-primary/10 overflow-hidden rounded-2xl">
        <CardHeader className="bg-primary text-white">
          <CardTitle className="flex items-center gap-2 text-xl font-black uppercase"><Key className="h-5 w-5" /> Mi Perfil Oficial</CardTitle>
          <CardDescription className="text-white/80">Actualice sus datos de identidad y acceso.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nombres y Apellidos</Label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value.toUpperCase())} className="pl-10 h-11 font-bold" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">DNI</Label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input value={newDni} maxLength={8} onChange={(e) => setNewDni(e.target.value.replace(/\D/g, ''))} className="pl-10 h-11 font-bold" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">ID Usuario</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="pl-10 h-11 font-bold" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contraseña Actual</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-11 font-bold" placeholder="Requerido para cambios" />
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nueva Contraseña</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-11 font-bold" placeholder="Opcional" />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-black text-xs uppercase tracking-widest" disabled={isUpdating}>
              {isUpdating ? 'GUARDANDO...' : 'ACTUALIZAR DATOS OFICIALES'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-xl border-amber-200 bg-amber-50/30 overflow-hidden rounded-2xl">
        <CardHeader className="bg-amber-600 text-white">
          <CardTitle className="flex items-center gap-2 uppercase"><Database className="h-5 w-5" /> Mantenimiento</CardTitle>
        </CardHeader>
        <CardContent className="pt-8 flex flex-col md:flex-row gap-6 items-center">
          <p className="text-xs font-medium text-amber-800 flex-1">Generar respaldo íntegro de expedientes y logs para auditoría estatal.</p>
          <Button onClick={() => setIsBackupDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700 h-12 px-8 font-black text-xs uppercase gap-2">
            <Download className="h-4 w-4" /> RESPALDO COMPLETO
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-black uppercase text-amber-800">Autorizar Descarga</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Contraseña de Oficial</Label>
            <Input type="password" value={backupPassword} onChange={(e) => setBackupPassword(e.target.value)} className={`h-11 font-bold ${backupError ? "border-destructive" : ""}`} />
          </div>
          <DialogFooter>
            <Button onClick={confirmBackup} className="w-full bg-amber-600 h-11 font-black uppercase">VALIDAR Y DESCARGAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
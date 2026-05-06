"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { api, ApiError } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Key, Database, Download, BadgeCheck, Fingerprint, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export function SettingsView() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();

  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newDni, setNewDni] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
      setNewFullName(user.fullName);
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast({ variant: 'destructive', title: 'Falta contraseña actual' });
      return;
    }
    if (newDni && newDni.length !== 8) {
      toast({ variant: 'destructive', title: 'DNI inválido', description: '8 dígitos.' });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Las contraseñas no coinciden' });
      return;
    }
    if (newPassword && newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'Contraseña insuficiente', description: 'Mínimo 8 caracteres.' });
      return;
    }

    setIsUpdating(true);
    try {
      await api.put('/api/users/me', {
        currentPassword,
        username: newUsername !== user?.username ? newUsername : undefined,
        fullName: newFullName !== user?.fullName ? newFullName : undefined,
        dni: newDni || undefined,
        newPassword: newPassword || undefined,
      });
      toast({ title: 'Perfil actualizado' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setNewDni('');
      await refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al actualizar';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmBackup = async () => {
    if (!backupPassword) return;
    setIsBackingUp(true);
    try {
      const data = await api.post<unknown>('/api/backup', { passwordConfirm: backupPassword });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BACKUP_SEGURANET_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setIsBackupDialogOpen(false);
      setBackupPassword('');
      toast({ title: 'Respaldo generado', description: 'El archivo está firmado con HMAC.' });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error en el respaldo';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsBackingUp(false);
    }
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
                  <Input value={newFullName} onChange={e => setNewFullName(e.target.value.toUpperCase())} className="pl-10 h-11 font-bold" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nuevo DNI (opcional)</Label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input value={newDni} maxLength={8} placeholder="Dejar vacío para no cambiar" onChange={e => setNewDni(e.target.value.replace(/\D/g, ''))} className="pl-10 h-11 font-bold" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">ID Usuario</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} className="pl-10 h-11 font-bold" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contraseña Actual *</Label>
                <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="h-11 font-bold" placeholder="Requerida" />
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nueva Contraseña</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-11 font-bold" placeholder="Opcional (mín. 8)" />
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Confirmar Nueva</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-11 font-bold" />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-black text-xs uppercase tracking-widest" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ACTUALIZAR DATOS OFICIALES'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-xl border-amber-200 bg-amber-50/30 overflow-hidden rounded-2xl">
        <CardHeader className="bg-amber-600 text-white">
          <CardTitle className="flex items-center gap-2 uppercase"><Database className="h-5 w-5" /> Mantenimiento</CardTitle>
        </CardHeader>
        <CardContent className="pt-8 flex flex-col md:flex-row gap-6 items-center">
          <p className="text-xs font-medium text-amber-800 flex-1">Generar respaldo íntegro de expedientes y logs (firmado con HMAC).</p>
          <Button onClick={() => setIsBackupDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700 h-12 px-8 font-black text-xs uppercase gap-2">
            <Download className="h-4 w-4" /> RESPALDO COMPLETO
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle className="text-xl font-black uppercase text-amber-800">Autorizar Descarga</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Contraseña de Oficial</Label>
            <Input type="password" value={backupPassword} onChange={e => setBackupPassword(e.target.value)} className="h-11 font-bold" />
          </div>
          <DialogFooter>
            <Button onClick={confirmBackup} className="w-full bg-amber-600 h-11 font-black uppercase" disabled={isBackingUp}>
              {isBackingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'VALIDAR Y DESCARGAR'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

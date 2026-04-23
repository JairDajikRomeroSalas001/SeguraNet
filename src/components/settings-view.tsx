"use client"

import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Save, AlertTriangle, ShieldCheck, Key, Database, Download, ShieldAlert, BadgeCheck, Fingerprint } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCases } from '@/lib/store';
import { logAuditEvent } from '@/lib/audit-logger';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export function SettingsView() {
  const { user, updateCredentials } = useAuth();
  const { toast } = useToast();
  
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [newFullName, setNewFullName] = useState(user?.fullName || '');
  const [newDni, setNewDni] = useState(user?.dni || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados para Backup
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupError, setBackupError] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const credsStr = localStorage.getItem('ps_credentials');
    const credentials = credsStr ? JSON.parse(credsStr) : [];
    const currentCred = credentials.find((c: any) => c.username === user?.username);

    if (currentPassword !== currentCred?.password) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "La contraseña actual ingresada es incorrecta."
      });
      return;
    }

    if (newDni.length !== 8 || !/^\d+$/.test(newDni)) {
      toast({ variant: "destructive", title: "DNI inválido", description: "El DNI debe tener 8 dígitos." });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error de Contraseña",
        description: "La nueva contraseña y su confirmación no coinciden."
      });
      return;
    }

    setIsUpdating(true);
    
    setTimeout(() => {
      updateCredentials(newUsername, newPassword || currentPassword, newFullName, newDni);
      setIsUpdating(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: "Perfil Actualizado",
        description: "Sus credenciales oficiales han sido modificadas correctamente."
      });
    }, 1000);
  };

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const value = e.target.value.replace(/\D/g, '');
    setter(value);
  };

  const handleBackupRequest = () => {
    setIsBackupDialogOpen(true);
    setBackupPassword('');
    setBackupError(false);
  };

  const confirmBackup = () => {
    const credsStr = localStorage.getItem('ps_credentials');
    const credentials = credsStr ? JSON.parse(credsStr) : [];
    const currentCred = credentials.find((c: any) => c.username === user?.username);

    if (backupPassword !== currentCred?.password) {
      setBackupError(true);
      toast({
        variant: "destructive",
        title: "Autorización Denegada",
        description: "Contraseña de administrador incorrecta."
      });
      logAuditEvent(user?.username || 'unknown', 'SECURITY_VIOLATION', 'Failed attempt to download system backup');
      return;
    }

    // Proceso de Respaldo
    try {
      const cases = getCases(true); 
      const auditLogs = JSON.parse(localStorage.getItem('ps_audit_logs') || '[]');
      
      const backupData = {
        sistema: "Paucartambo Segura v2.0",
        fecha_respaldo: new Date().toISOString(),
        oficial_responsable: user?.fullName,
        base_de_datos: {
          expedientes: cases,
          logs_auditoria: auditLogs
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `RESPALDO_SISTEMA_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logAuditEvent(user?.username || 'unknown', 'SYSTEM_BACKUP', 'Full database and audit logs backup generated');
      
      toast({
        title: "Respaldo Generado",
        description: "La copia de seguridad se ha descargado correctamente."
      });
      
      setIsBackupDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de Sistema",
        description: "No se pudo generar el respaldo de datos."
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Card className="shadow-xl border-primary/10 overflow-hidden rounded-2xl">
        <CardHeader className="bg-primary text-white py-6">
          <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
            <Key className="h-5 w-5" /> Seguridad de Cuenta
          </CardTitle>
          <CardDescription className="text-white/80 font-medium">
            Actualice sus datos y credenciales oficiales.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="new-fullname" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nombres y Apellidos Completos</Label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input 
                    id="new-fullname"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="pl-10 h-11 rounded-xl font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-dni" className="text-[10px] font-black uppercase text-muted-foreground ml-1">DNI (8 dígitos)</Label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input 
                    id="new-dni"
                    value={newDni}
                    maxLength={8}
                    onChange={(e) => handleNumericInput(e, setNewDni)}
                    className="pl-10 h-11 rounded-xl font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-username" className="text-[10px] font-black uppercase text-muted-foreground ml-1">ID / Usuario (Login)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input 
                    id="new-username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="pl-10 h-11 rounded-xl font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-pass" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contraseña Actual</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input 
                    id="current-pass"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10 h-11 rounded-xl font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pass" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nueva Contraseña (Opcional)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input 
                    id="new-pass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 h-11 rounded-xl font-bold"
                    placeholder="En blanco para no cambiar"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 h-12 font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20"
              disabled={isUpdating}
            >
              {isUpdating ? 'PROCESANDO CAMBIO...' : 'ACTUALIZAR DATOS OFICIALES'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-xl border-amber-200 overflow-hidden rounded-2xl bg-amber-50/30">
        <CardHeader className="bg-amber-600 text-white py-6">
          <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
            <Database className="h-5 w-5" /> Mantenimiento de Datos
          </CardTitle>
          <CardDescription className="text-white/80 font-medium">
            Respaldo y cumplimiento de auditoría estatal.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="p-4 bg-amber-100 rounded-2xl border border-amber-200 flex-1">
              <div className="flex items-center gap-2 mb-2 text-amber-800">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Protocolo de Respaldo</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-tight font-medium">
                Esta opción genera una copia íntegra del sistema. Toda descarga quedará registrada en el log de auditoría.
              </p>
            </div>
            <Button 
              onClick={handleBackupRequest}
              className="bg-amber-600 hover:bg-amber-700 h-14 px-8 font-black text-xs uppercase tracking-widest gap-2 rounded-xl shadow-lg shadow-amber-600/20 w-full md:w-auto"
            >
              <Download className="h-5 w-5" /> DESCARGAR COPIA DE SEGURIDAD
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle className="text-xl font-black text-amber-800 uppercase">Autorizar Respaldo</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase pt-2">
              Valide su identidad para exportar la base de datos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contraseña Oficial</Label>
              <Input 
                type="password"
                placeholder="Confirme su contraseña"
                className={`h-11 rounded-xl text-center font-bold ${backupError ? "border-destructive" : ""}`}
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmBackup()}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button 
              onClick={confirmBackup} 
              className="w-full bg-amber-600 hover:bg-amber-700 h-11 text-xs font-black uppercase rounded-xl"
            >
              VALIDAR Y DESCARGAR
            </Button>
            <Button variant="ghost" onClick={() => setIsBackupDialogOpen(false)} className="text-[10px] font-bold uppercase">Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

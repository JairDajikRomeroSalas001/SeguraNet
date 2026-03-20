"use client"

import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Save, AlertTriangle, ShieldCheck, Key } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SettingsView() {
  const { user, updateCredentials } = useAuth();
  const { toast } = useToast();
  
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones de seguridad simuladas
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

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error de Contraseña",
        description: "La nueva contraseña y su confirmación no coinciden."
      });
      return;
    }

    if (newPassword.length < 4) {
      toast({
        variant: "destructive",
        title: "Error de Seguridad",
        description: "La nueva contraseña debe tener al menos 4 caracteres."
      });
      return;
    }

    setIsUpdating(true);
    
    // Simular guardado
    setTimeout(() => {
      updateCredentials(newUsername, newPassword);
      setIsUpdating(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: "Perfil Actualizado",
        description: "Sus credenciales de acceso han sido modificadas correctamente."
      });
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-xl border-primary/10 overflow-hidden">
        <CardHeader className="bg-primary text-white py-6">
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> Configuración de Seguridad
          </CardTitle>
          <CardDescription className="text-white/80">
            Actualice sus credenciales oficiales de acceso al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-username" className="text-xs font-bold uppercase text-muted-foreground">Nuevo Nombre de Usuario</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                    <Input 
                      id="new-username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="pl-10"
                      placeholder="Identificador de Oficial"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current-pass" className="text-xs font-bold uppercase text-muted-foreground">Contraseña Actual</Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                    <Input 
                      id="current-pass"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Verifique identidad"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-pass" className="text-xs font-bold uppercase text-muted-foreground">Nueva Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                    <Input 
                      id="new-pass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Mínimo 4 caracteres"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pass" className="text-xs font-bold uppercase text-muted-foreground">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                    <Input 
                      id="confirm-pass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Repita contraseña"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 text-xs font-bold uppercase">Advertencia de Seguridad</AlertTitle>
              <AlertDescription className="text-amber-700 text-[11px] leading-tight mt-1">
                Al cambiar sus credenciales, deberá utilizar los nuevos datos para su próximo inicio de sesión. No comparta estos datos con personal no autorizado.
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 h-12 font-bold uppercase tracking-widest"
              disabled={isUpdating}
            >
              {isUpdating ? 'PROCESANDO CAMBIO...' : 'ACTUALIZAR CREDENCIALES OFICIALES'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="bg-muted/30 py-4 flex justify-center border-t">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
            Ministerio del Interior • PNP Paucartambo
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

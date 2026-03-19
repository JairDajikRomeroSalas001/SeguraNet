"use client"

import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ShieldCheck, User, Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function LoginView() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    const success = login(username, password);
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-white mb-6 shadow-xl border-4 border-white">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-2">Paucartambo Segura</h1>
          <p className="text-muted-foreground font-medium">Sistema de Registro de Denuncias</p>
          <p className="text-xs text-muted-foreground/60 mt-1 uppercase tracking-widest">Comisaría de Paucartambo</p>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">
              Ingrese sus credenciales de oficial autorizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in zoom-in duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de acceso</AlertTitle>
                <AlertDescription>
                  Credenciales inválidas. Por favor intente de nuevo.
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="username" 
                    placeholder="Nombre de usuario" 
                    className="pl-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg">
                Ingresar al Sistema
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-center text-xs text-muted-foreground pt-0">
            <div className="bg-secondary/50 p-3 rounded-md w-full border border-dashed border-primary/20">
              <p className="font-semibold text-primary/70 mb-1">Cuentas de administrador predeterminadas:</p>
              <p>User: <span className="font-mono">admin1</span> | Pass: <span className="font-mono">admin1</span></p>
              <p>User: <span className="font-mono">admin2</span> | Pass: <span className="font-mono">admin2</span></p>
            </div>
          </CardFooter>
        </Card>
        
        <p className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">
          República del Perú - Ministerio del Interior
        </p>
      </div>
    </div>
  );
}
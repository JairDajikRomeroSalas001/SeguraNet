"use client"

import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ShieldCheck, User, Lock, AlertCircle, Shield, Globe, Phone, Mail } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 mb-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary text-white mb-2 shadow-[0_0_40px_rgba(54,71,125,0.3)] border-4 border-white transition-transform hover:scale-105 duration-300">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Paucartambo Segura</h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground font-semibold uppercase tracking-[0.3em] text-[10px]">
              <Shield className="h-3 w-3" />
              Comisaría de Paucartambo
            </div>
          </div>
        </div>

        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-sm bg-white/90">
          <CardHeader className="space-y-1 pb-6 text-center border-b bg-muted/30 rounded-t-lg">
            <CardTitle className="text-xl">Acceso Restringido</CardTitle>
            <CardDescription>
              Personal policial autorizado únicamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-8">
            {error && (
              <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de acceso</AlertTitle>
                <AlertDescription>
                  Credenciales inválidas. Verifique su usuario y contraseña.
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase text-muted-foreground ml-1">Usuario</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="username" 
                    placeholder="ID de Oficial" 
                    className="pl-10 h-11 transition-all border-muted focus:ring-primary/20"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase text-muted-foreground ml-1">Contraseña</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-11 transition-all border-muted focus:ring-primary/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg text-base font-bold transition-all hover:scale-[1.02] active:scale-95">
                Iniciar Sesión
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-center text-[10px] text-muted-foreground pt-0 pb-8">
            <div className="bg-secondary/30 p-4 rounded-xl w-full border border-dashed border-primary/20">
              <p className="font-bold text-primary mb-1 uppercase tracking-wider">Modo Demo Activado</p>
              <p>User: <span className="font-mono font-bold bg-white px-1 rounded">admin1</span> | Pass: <span className="font-mono font-bold bg-white px-1 rounded">admin1</span></p>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Footer Branding Codex Cusco */}
      <div className="w-full max-w-lg space-y-4 text-center opacity-70 hover:opacity-100 transition-opacity duration-500">
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.4em] font-bold">
          Gobierno del Perú • Ministerio del Interior • PNP Paucartambo © {new Date().getFullYear()}
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Desarrollado por</span>
            <span className="text-xs font-black text-primary tracking-widest">CODEX CUSCO</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-[10px] font-bold text-muted-foreground/80">
            <a href="https://codexcusco.com" target="_blank" className="hover:text-primary flex items-center gap-1">
              <Globe className="h-3 w-3" /> codexcusco.com
            </a>
            <a href="tel:+51972156954" className="hover:text-primary flex items-center gap-1">
              <Phone className="h-3 w-3" /> 972 156 954
            </a>
            <a href="mailto:CODEXCUSCO@GMAIL.COM" className="hover:text-primary flex items-center gap-1">
              <Mail className="h-3 w-3" /> CODEXCUSCO@GMAIL.COM
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

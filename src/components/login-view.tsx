"use client";

import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ShieldCheck, User, Lock, AlertCircle, Shield, Globe, Phone, Mail, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function LoginView() {
  const { login, isLocked } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pnpLogo = PlaceHolderImages.find(img => img.id === 'pnp-logo');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isSubmitting) return;
    setError(false);
    setIsSubmitting(true);
    const ok = await login(username, password);
    setIsSubmitting(false);
    if (!ok) setError(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 mb-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white p-2 shadow-[0_0_40px_rgba(54,71,125,0.2)] border-2 border-white transition-transform hover:scale-105 duration-300 overflow-hidden">
            {pnpLogo && (
              <Image src={pnpLogo.imageUrl} alt="Logo PNP" width={80} height={80} className="object-contain" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-primary tracking-tight">Paucartambo Segura</h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground font-semibold uppercase tracking-[0.2em] text-[9px]">
              <Shield className="h-3 w-3" /> Comisaría de Paucartambo
            </div>
          </div>
        </div>

        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-sm bg-white/90">
          <CardHeader className="space-y-1 pb-4 text-center border-b bg-muted/30 rounded-t-lg">
            <CardTitle className="text-lg">Acceso Restringido</CardTitle>
            <CardDescription className="text-xs">Personal policial autorizado únicamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {isLocked && (
              <Alert variant="destructive" className="bg-destructive/10">
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle className="text-xs font-black">SISTEMA BLOQUEADO</AlertTitle>
                <AlertDescription className="text-[10px]">
                  Demasiados intentos fallidos. Espere antes de reintentar.
                </AlertDescription>
              </Alert>
            )}
            {error && !isLocked && (
              <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs">Error de acceso</AlertTitle>
                <AlertDescription className="text-[10px]">
                  Credenciales inválidas. El intento ha sido registrado.
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Usuario</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input id="username" placeholder="ID de Oficial" className="pl-9 h-10 text-sm" value={username} onChange={e => setUsername(e.target.value)} required disabled={isLocked || isSubmitting} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Contraseña</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-9 h-10 text-sm" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLocked || isSubmitting} />
                </div>
              </div>
              <Button type="submit" className="w-full h-10 bg-primary hover:bg-primary/90 shadow-lg text-sm font-bold transition-all" disabled={isLocked || isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pb-6">
            <p className="text-[8px] text-center w-full text-muted-foreground uppercase tracking-widest font-bold">
              CONEXIÓN CIFRADA TLS • SGTD-PCM • LEY 29733
            </p>
          </CardFooter>
        </Card>
      </div>

      <div className="w-full max-w-lg space-y-4 text-center opacity-90 mb-6">
        <p className="text-[8px] text-muted-foreground uppercase tracking-[0.3em] font-bold">
          PNP Paucartambo © {new Date().getFullYear()}
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-medium">Desarrollado por</span>
            <span className="text-xs font-black text-primary tracking-widest">CODEX CUSCO</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-[9px] font-bold text-muted-foreground/80">
            <a href="https://codexcusco.com" target="_blank" className="hover:text-primary flex items-center gap-1"><Globe className="h-2.5 w-2.5" /> codexcusco.com</a>
            <a href="tel:+51972156954" className="hover:text-primary flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> 972 156 954</a>
            <a href="mailto:CODEXCUSCO@GMAIL.COM" className="hover:text-primary flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> CODEXCUSCO@GMAIL.COM</a>
          </div>
        </div>
      </div>
    </div>
  );
}

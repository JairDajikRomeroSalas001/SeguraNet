"use client"

import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, UserMinus, ShieldCheck, Users, ShieldAlert, BadgeCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function UsersManagement() {
  const { getAllUsers, addUser, deleteUser, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState(getAllUsers());
  
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newPassword.length < 4) {
        toast({ variant: "destructive", title: "Seguridad insuficiente", description: "La contraseña debe tener al menos 4 caracteres." });
        return;
      }
      
      addUser(newUsername, newPassword, newFullName);
      setUsers(getAllUsers());
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setIsDialogOpen(false);
      
      toast({ title: "Usuario Creado", description: `El efectivo ${newFullName} ha sido registrado exitosamente.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDeleteUser = (username: string) => {
    try {
      deleteUser(username);
      setUsers(getAllUsers());
      toast({ title: "Usuario Eliminado", description: `La cuenta de ${username} ha sido dada de baja.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-primary flex items-center gap-2">
            <Users className="h-6 w-6" /> Gestión de Personal Policial
          </h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Control de Acceso • Comisaría de Paucartambo
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 h-11 px-6 font-black text-xs uppercase tracking-widest gap-2 rounded-xl shadow-lg shadow-primary/20">
              <UserPlus className="h-4 w-4" /> Registrar Nuevo Efectivo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-xl font-black text-primary uppercase">Alta de Usuario Oficial</DialogTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-tight pt-1">
                Ingrese las credenciales para el nuevo oficial
              </CardDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-fullname" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nombres y Apellidos Completos</Label>
                <Input 
                  id="new-fullname"
                  placeholder="Ej: SOT2 PNP CARLOS RAMOS"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="h-11 rounded-xl font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-username" className="text-[10px] font-black uppercase text-muted-foreground ml-1">ID de Usuario (Login)</Label>
                <Input 
                  id="new-username"
                  placeholder="Ej: ramos.pnp"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="h-11 rounded-xl font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contraseña de Acceso</Label>
                <Input 
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 4 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 rounded-xl font-bold"
                  required
                />
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 flex gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-[10px] text-amber-700 font-medium leading-tight">
                  Al crear este usuario, usted asume la responsabilidad administrativa de su acceso al sistema de denuncias.
                </p>
              </div>
              <DialogFooter className="sm:justify-center pt-2">
                <Button type="submit" className="w-full h-11 font-black text-xs uppercase tracking-widest rounded-xl">
                  VALIDAR Y CREAR CUENTA
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-primary/10 shadow-xl overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-black text-primary text-[10px] uppercase tracking-wider py-4">Oficial (Nombres y Apellidos)</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase tracking-wider py-4 text-center">ID / Usuario</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase tracking-wider py-4 text-center">Estado de Seguridad</TableHead>
                <TableHead className="text-right font-black text-primary text-[10px] uppercase tracking-wider py-4">Acciones Administrativas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.username} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      </div>
                      <span className="uppercase">{u.fullName}</span>
                      {currentUser?.username === u.username && (
                        <Badge variant="secondary" className="text-[9px] font-black bg-emerald-100 text-emerald-700 border-emerald-200">SESIÓN ACTUAL</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary bg-primary/5">
                      {u.username}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold text-[10px]">
                      <BadgeCheck className="h-3 w-3" /> VERIFICADO POR PCM
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteUser(u.username)}
                      disabled={currentUser?.username === u.username}
                      className="h-8 gap-2 text-[10px] font-black text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg px-3"
                    >
                      <UserMinus className="h-3.5 w-3.5" /> DAR DE BAJA
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

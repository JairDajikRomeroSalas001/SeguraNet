"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { api, ApiError } from '@/lib/api-client';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, UserMinus, ShieldCheck, Users, ShieldAlert, BadgeCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { maskDni } from '@/lib/masks';
import type { Role } from '@/lib/types';

interface UserRow {
  uid: string;
  username: string;
  fullName: string;
  dni: string;
  role: Role;
  isActive: boolean;
}

export function UsersManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newDni, setNewDni] = useState('');
  const [newRole, setNewRole] = useState<Role>('oficial_operativo');

  const isSuperadmin = currentUser?.role === 'superadmin';

  const reload = async () => {
    setIsLoading(true);
    try {
      const { users } = await api.get<{ users: UserRow[] }>('/api/users');
      setUsers(users.filter(u => u.isActive));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (isSuperadmin) reload(); }, [isSuperadmin]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin || isSubmitting) return;
    if (newDni.length !== 8) {
      toast({ variant: 'destructive', title: 'DNI inválido', description: '8 dígitos numéricos.' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'Contraseña insuficiente', description: 'Mínimo 8 caracteres.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/api/users', {
        username: newUsername,
        password: newPassword,
        fullName: newFullName,
        dni: newDni,
        role: newRole,
      });
      toast({ title: 'Usuario creado', description: `${newFullName} fue registrado.` });
      setNewUsername(''); setNewPassword(''); setNewFullName(''); setNewDni(''); setNewRole('oficial_operativo');
      setIsDialogOpen(false);
      await reload();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al crear usuario';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (u: UserRow) => {
    if (!isSuperadmin) return;
    if (u.uid === currentUser?.uid) {
      toast({ variant: 'destructive', title: 'Acción prohibida', description: 'No puedes eliminar tu propia cuenta.' });
      return;
    }
    try {
      await api.delete(`/api/users/${u.uid}`);
      toast({ title: 'Usuario dado de baja', description: u.username });
      await reload();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al eliminar';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    }
  };

  const onlyDigits = (e: React.ChangeEvent<HTMLInputElement>, set: (v: string) => void) =>
    set(e.target.value.replace(/\D/g, ''));

  if (!isSuperadmin) {
    return <div className="p-8 text-center font-bold text-destructive">ACCESO DENEGADO. RECURSO SOLO PARA SUPERADMIN.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-primary flex items-center gap-2"><Users className="h-6 w-6" /> Gestión de Personal Policial</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Control de Acceso • Comisaría de Paucartambo</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 h-11 px-6 font-black text-xs uppercase tracking-widest gap-2 rounded-xl shadow-lg shadow-primary/20">
              <UserPlus className="h-4 w-4" /> Registrar Nuevo Efectivo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader><DialogTitle className="text-xl font-black text-primary uppercase">Alta de Usuario Oficial</DialogTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-tight pt-1">Ingrese los datos del nuevo oficial</CardDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nombres y Apellidos</Label>
                <Input placeholder="Ej: SOT2 PNP CARLOS RAMOS" value={newFullName} onChange={e => setNewFullName(e.target.value.toUpperCase())} className="h-11 rounded-xl font-bold" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">DNI</Label>
                  <Input maxLength={8} value={newDni} onChange={e => onlyDigits(e, setNewDni)} className="h-11 rounded-xl font-bold" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">ID Usuario</Label>
                  <Input placeholder="ramos.pnp" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="h-11 rounded-xl font-bold" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contraseña (mín. 8)</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-11 rounded-xl font-bold" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Rol</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                  <SelectTrigger className="h-11 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oficial_operativo">Oficial Operativo</SelectItem>
                    <SelectItem value="auditor">Auditor (solo lectura)</SelectItem>
                    <SelectItem value="readonly">Solo lectura</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 flex gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-[10px] text-amber-700 font-medium leading-tight">El alta queda registrada en auditoría con su firma digital.</p>
              </div>
              <DialogFooter className="sm:justify-center pt-2">
                <Button type="submit" className="w-full h-11 font-black text-xs uppercase tracking-widest rounded-xl" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'VALIDAR Y CREAR CUENTA'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-primary/10 shadow-xl overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-black text-primary text-[10px] uppercase">Oficial</TableHead>
                  <TableHead className="font-black text-primary text-[10px] uppercase text-center">DNI</TableHead>
                  <TableHead className="font-black text-primary text-[10px] uppercase text-center">Usuario</TableHead>
                  <TableHead className="font-black text-primary text-[10px] uppercase text-center">Rol</TableHead>
                  <TableHead className="text-right font-black text-primary text-[10px] uppercase">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.uid}>
                    <TableCell className="font-bold text-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-primary" /></div>
                        <div className="flex flex-col">
                          <span className="uppercase">{u.fullName}</span>
                          {currentUser?.uid === u.uid && <Badge variant="secondary" className="text-[9px] font-black bg-emerald-100 text-emerald-700 border-emerald-200 w-fit">SESIÓN ACTIVA</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">{maskDni(u.dni)}</TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary bg-primary/5">{u.username}</Badge></TableCell>
                    <TableCell className="text-center text-[10px] font-bold uppercase">{u.role.replace('_', ' ')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(u)} disabled={u.uid === currentUser?.uid}
                        className="h-8 gap-2 text-[10px] font-black text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg px-3 disabled:opacity-30">
                        <UserMinus className="h-3.5 w-3.5" /> BAJA
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
